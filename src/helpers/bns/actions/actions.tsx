import {
  I_BnsState,
  BnsActionType,
  I_BNS_Action,
  I_BNS_Auto_Action,
  I_Condition,
  I_TX,
  BnsBidType,
  BnsSuggestionType
} from './../types/'
import { MIN_NOTIFY, MIN_BURN, CHALLENGE_MIN_MULTIPLY } from './../constants'
import {
  existsCurrentOwner,
  isOwnerExpired,
  clearOwner,
  getParsedHeight,
  atLeastTwoOutputs,
  isNotify,
  isOpreturnOutput0,
  didNotifyMin,
  didBurnMin,
  setOwner,
  getOwner,
  getUser,
  getTxInput0SourceUserAddress,
  getTxHeight,
  getTxTimestamp,
  isAddressTheCurrentOwner,
  burnedPreviousRateMin,
  readEmbeddedData,
  getLastOwnerBurnedValue,
  isSenderTheCurrentOwner,
  updateUtxoFromTx,
  noUnspentUserNotificationsUtxo,
  getNotificationAddress,
  isCommandCalled,
  getCommandCalled,
  existsUser,
  createNewUser,
  addBid,
  isBiddingOver,
  endBidding,
  isBiddingOngoing,
  isSenderACurrentBidder,
  isAddressACurrentBidder,
  subtractRefunds,
  unrefundedAmounts
} from './../formathelpers'

/* -------------------------------------------------------------------------- */
/*                          Conditoins / Permissions                          */
/* -------------------------------------------------------------------------- */

// const NONE = (args: any): I_Condition => ({
//   status: () => true,
//   info: { describe: 'No requirements', warning: 'Placeholder only' }
// })

const OUTS_2 = ({ tx = undefined }: any = {}): I_Condition => ({
  status: () => atLeastTwoOutputs(tx),
  info: { describe: 'Must have 2+ outputs' }
})

const OUT_0 = ({ tx = undefined }: any = {}): I_Condition => ({
  status: () => isOpreturnOutput0(tx),
  info: { describe: 'Must have OP_RETURN @ output[0]' }
})

const OUT_1 = ({ st, tx = undefined }: any = {}): I_Condition => ({
  status: () => isNotify(st, tx),
  info: { describe: 'Must have notification address @ output[1]' }
})

const NOTIFIED_MIN = ({ tx = undefined }: any = {}): I_Condition => ({
  status: () => didNotifyMin(tx),
  info: {
    describe: `Notification output amount must not be lower than the BNS minimum`,
    set: { value: MIN_NOTIFY, name: 'Notification minimum', units: 'satoshi' }
  }
})

const BURNED_MIN = ({ tx = undefined }: any = {}): I_Condition => ({
  status: () => didBurnMin(tx),
  info: {
    describe: `Must burn (i.e. bid) at least the BNS minimum amount`,
    set: { value: MIN_BURN, units: 'satoshi', name: 'Bid burn amount' }
  }
})

const NO_OWNER = ({ st }: any = {}): I_Condition => ({
  status: () => !existsCurrentOwner(st),
  info: { describe: 'There must not be an existing owner' }
})

const EXISTS_OWNER = ({ st }: any = {}): I_Condition => ({
  status: () => existsCurrentOwner(st),
  info: { describe: 'There must be existing owner' }
})

const BURN_LAST_WIN = ({ st, tx = undefined }: any = {}): I_Condition => ({
  status: () => burnedPreviousRateMin(st, tx),
  info: {
    describe: 'Tx must burn the last ownership winning burn amount',
    set: {
      value: getLastOwnerBurnedValue(st),
      name: 'Bid burn amount',
      units: 'satoshi'
    }
  }
})

// calculated based on tx if available, otherwise address
const USER_IS_OWNER = ({
  st,
  address,
  tx = undefined
}: any = {}): I_Condition => ({
  status: () =>
    tx
      ? isSenderTheCurrentOwner(st, tx)
      : isAddressTheCurrentOwner(st, address),
  info: { describe: `User's address must match owner's address` }
})

const USER_IS_BIDDER = ({
  st,
  address,
  tx = undefined
}: any = {}): I_Condition => ({
  status: () =>
    tx ? isSenderACurrentBidder(st, tx) : isAddressACurrentBidder(st, address),
  info: { describe: `User's address must match one of bidder's addresses` }
})

const IS_OWNER_EXPIRED = ({ st }: any = {}): I_Condition => ({
  status: () => isOwnerExpired(st),
  info: { describe: 'Ownership must be expired at current parsed height' }
})

const NO_UNSPENT_USER_NOTIFICATIONS_UTXO = ({
  st,
  tx = undefined
}: any = {}): I_Condition => ({
  status: () => noUnspentUserNotificationsUtxo(st, tx),
  info: {
    describe:
      'There must not be any remaining notification address utxo created by sender'
  }
})

// easy mistake to make
const USER_ADDRESS_NOT_NOTIFICATION_ADDRESS = ({
  st,
  tx = undefined
}: any = {}): I_Condition => ({
  status: () => getNotificationAddress(st) !== getTxInput0SourceUserAddress(tx),
  info: {
    describe: 'Do not accidentally send from notification address at input[0]'
  }
})

const IS_COMMAND_CALLED = ({
  st,
  command,
  tx = undefined
}: any = {}): I_Condition => ({
  status: () => isCommandCalled(st, tx as I_TX, command),
  info: {
    describe: 'Checks forwards for a specific command issued at this height'
  }
})

const IS_BIDDING_ONGOING = ({ st }: any = {}): I_Condition => ({
  status: () => isBiddingOngoing(st),
  info: { describe: 'The domain is undergoing a bidding period' }
})

const IS_BIDDING_OVER = ({ st }: any = {}): I_Condition => ({
  status: () => isBiddingOver(st),
  info: { describe: 'The bidding period must be over but not resolved' }
})

/* -------------------------------------------------------------------------- */
/*              Suggestions (e.g. values to set or get from user)             */
/* -------------------------------------------------------------------------- */

const SUGGESTION_SUBMIT_NEW_ADDRESS = ({ command }: any = {}): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Submit your new address (forwards are kept)',
    get: { value: '', name: 'Your new address' },
    command
  }
})

const SUGGESTION_SUBMIT_NEW_OWNER_ADDRESS = ({
  command
}: any = {}): I_Condition => ({
  status: () => true,
  info: {
    describe: "Submit new owner's address (forwards are not copied)",
    get: { value: '', name: "New owner's address" },
    command
  }
})

const SUGGESTION_SUBMIT_BURN_AMOUNT = ({ st }: any = {}): I_Condition => {
  const calcMin = !st
    ? // default
      undefined
    : // but when state provided:
    // and there are existing bids
    st.domain.bidding.bids.length > 0
    ? // return the highest of the bids
      Math.ceil(
        Math.max(...st.domain.bidding.bids.map((bid: any) => bid.value)) *
          CHALLENGE_MIN_MULTIPLY
      )
    : // otherwise return burn minimum
      MIN_BURN

  return {
    status: () => true,
    info: {
      describe: 'Submit your bid burn amount',
      get: {
        value: calcMin || 0,
        name: 'Bid burn amount',
        // good guess for min next bid is CHALLENGE_MIN_MULTIPLY x (highest known bid)
        // assuming they all meet the rules  by end of bidding
        min: calcMin,
        units: 'satoshi'
      }
    }
  }
}

/**
 * Need a way to suggest refunds and how much but not force it. Only suggests to set or get values if there are refunds to do.
 */
const SUGGESTION_REFUND_PAST_BIDDERS = ({
  st,
  address = undefined
}: any = {}): I_Condition => {
  const describe =
    'Must refund all prior bids for bid to count as valid at the end of the bidding period. Refunds can be done separately or during the bid'

  let refunds = ''

  if (st) {
    const ignoreAddress = address // if provided, can ignore for refund suggestions

    const leftAmounts = unrefundedAmounts(st)
    for (const toAddress in leftAmounts) {
      if (ignoreAddress && toAddress !== ignoreAddress) {
        refunds += leftAmounts[toAddress] + ' ' + toAddress + '\n'
      }
    }
    refunds = refunds.slice(0, -1)
  }

  if (refunds === '') {
    return {
      status: () => true,
      info: { describe }
    }
  } else {
    return {
      status: () => true,
      info: {
        describe,
        type: BnsSuggestionType.REFUND_BIDDERS,
        get: {
          value: false,
          name: 'Refund now?'
        },
        set: {
          value: refunds,
          name: 'Amount & address to refund',
          units: 'satoshi address'
        }
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*               Warnings (if action is a bad idea but possible)              */
/* -------------------------------------------------------------------------- */

const WARNING_POINTLESS_IF_NOT_OWNER = (args: any): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Action not recommended for non-owners',
    warning: !USER_IS_OWNER(args)?.status()
      ? 'Useless unless you are the owner or will be owner in future'
      : undefined
  }
})

const WARN_IF_NOT_BIDDER = (args: any): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Action not recommended for non-bidders',
    warning: !USER_IS_BIDDER(args)?.status()
      ? 'Useless unless you are a bidder or will be bidder in this period later'
      : undefined
  }
})

/* -------------------------------------------------------------------------- */
/*                           User's possible actions                          */
/* -------------------------------------------------------------------------- */

/**
 * One of requirements for bids is to refund past bidders by the time bidding period is over. This action allows doing that separately.
 */
export const refundOtherBidders = (
  st: I_BnsState | null,
  address = '',
  tx: any = undefined
): I_BNS_Action => {
  const args = { st, tx, address }

  const type = BnsActionType.REFUND_OTHER_BIDS

  const info = 'Refund other bidders for bids to count.'

  const permissions = [
    IS_BIDDING_ONGOING,

    // suggestions
    WARN_IF_NOT_BIDDER
  ]

  const conditions = [
    NOTIFIED_MIN,
    NO_UNSPENT_USER_NOTIFICATIONS_UTXO,
    USER_ADDRESS_NOT_NOTIFICATION_ADDRESS
  ]

  const execute = !st
    ? pass
    : () => {
        console.assert(!!tx, 'Must not execute action without tx')
        subtractRefunds(st, tx)
      }

  return {
    permissions: st
      ? permissions.map(permission => permission(args))
      : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args,
    info,
    type,
    execute
  }
}

// Describe: If no owner, sender can start process to claim ownership
// Since autoChecks run before user action checks in calcBnsState,
// after bidding ends owner will be set by time this is checked.
export const bidForOwnershipAction = (
  st: I_BnsState | null,
  address = '',
  tx: any = undefined
): I_BNS_Action => {
  const args = { st, tx, address }

  const type = BnsActionType.BID_FOR_OWNERSHIP

  const info = 'Bid for ownership of a domain'

  const permissions = [
    // this means no more bids when there's a winner
    NO_OWNER,

    // suggestions
    SUGGESTION_SUBMIT_BURN_AMOUNT,
    SUGGESTION_REFUND_PAST_BIDDERS
  ]

  const conditions = [
    // minimum rules to counting tx still apply for bids
    OUTS_2,
    OUT_0,
    OUT_1,
    NOTIFIED_MIN,
    NO_UNSPENT_USER_NOTIFICATIONS_UTXO,
    USER_ADDRESS_NOT_NOTIFICATION_ADDRESS,

    // at very least minimum is burnt, the rest is derived
    BURNED_MIN
  ]

  const execute = !st
    ? pass
    : () => {
        // have to start or add to bidding
        // ownership will be derived through automatic check based on bidding started here
        addBid(st, tx, BnsBidType.BURN)
      }

  return {
    permissions: st
      ? permissions.map(permission => permission(args))
      : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args,
    info,
    type,
    execute
  }

  // need to get user input on burn amount possible minimum (general action guidance)
  // also needs some guidance for refunds necessary to win (general action guidance)
}

/**
 * Change address. (similar to send ownership, but keeps forwards)
 * network: '!ca'
 * address: 'newaddress'
 */
export const changeAddressAction = (
  st: I_BnsState | null,
  address = '',
  tx: any = undefined
): I_BNS_Action => {
  const command = '!ca'

  const args = { st, address, tx, command }

  const type = BnsActionType.CHANGE_ADDRESS

  const info = 'Update your ownership address'

  const permissions = [
    USER_IS_OWNER,

    // suggestions
    SUGGESTION_SUBMIT_NEW_ADDRESS
  ]

  const conditions = [
    OUTS_2,
    OUT_0,
    OUT_1,
    NOTIFIED_MIN,
    NO_UNSPENT_USER_NOTIFICATIONS_UTXO,
    USER_ADDRESS_NOT_NOTIFICATION_ADDRESS,

    IS_COMMAND_CALLED
  ]

  const execute = !st
    ? pass
    : () => {
        const thisCommand = getCommandCalled(st, tx, command)
        const newAddress = thisCommand?.address
        if (!newAddress) {
          console.log('ownership transfer detected, but no address found')
        } else {
          // quite possible user doesn't exist so create blank one
          if (!existsUser(st, newAddress)) createNewUser(st, newAddress)

          // new owner is created and given old owner's ownership data

          const oldOwner = getOwner(st)
          setOwner(st, newAddress)
          // one of conditions is USER_IS_OWNER so there is owner
          getUser(st, newAddress).winHeight = oldOwner!.winHeight
          getUser(st, newAddress).winTimestamp = oldOwner!.winTimestamp
          getUser(st, newAddress).burnAmount = oldOwner!.burnAmount
          // clone forwards
          getUser(st, newAddress).forwards = JSON.parse(
            JSON.stringify(oldOwner!.forwards)
          )
          // for new user, no changes to updateHeight, nonce

          // old owner loses ownership data
          oldOwner!.winHeight = 0
          oldOwner!.winTimestamp = 0
          oldOwner!.burnAmount = 0
          // nonce, forwards (not active now), update height are not touched
          console.log(
            'ownership transfered from',
            oldOwner!.address,
            'to',
            newAddress
          )
        }
      }

  return {
    permissions: st
      ? permissions.map(permission => permission(args))
      : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args,
    info,
    type,
    execute
  }
}

/**
 * Send ownership to another address. Forwards are not kept.
 * network: '!so'
 * address: 'newaddress'
 */
export const sendOwnershipAction = (
  st: I_BnsState | null,
  address = '',
  tx: any = undefined
): I_BNS_Action => {
  const command = '!so'

  const args = { st, address, tx, command }

  const type = BnsActionType.SEND_OWNERSHIP

  const info = 'Give up ownership to another address'

  const permissions = [
    USER_IS_OWNER,

    // suggestions
    SUGGESTION_SUBMIT_NEW_OWNER_ADDRESS
  ]

  const conditions = [
    OUTS_2,
    OUT_0,
    OUT_1,
    NOTIFIED_MIN,
    NO_UNSPENT_USER_NOTIFICATIONS_UTXO,
    USER_ADDRESS_NOT_NOTIFICATION_ADDRESS,

    IS_COMMAND_CALLED
  ]

  const execute = !st
    ? pass
    : () => {
        const thisCommand = getCommandCalled(st, tx, command)
        const newAddress = thisCommand?.address
        if (!newAddress) {
          console.log('ownership transfer detected, but no address found')
        } else {
          // quite possible user doesn't exist so create blank one
          if (!existsUser(st, newAddress)) createNewUser(st, newAddress)

          // new owner is created and given old owner's ownership data

          const oldOwner = getOwner(st)
          setOwner(st, newAddress)
          // one of conditions is USER_IS_OWNER so there is owner
          getUser(st, newAddress).winHeight = oldOwner!.winHeight
          getUser(st, newAddress).winTimestamp = oldOwner!.winTimestamp
          getUser(st, newAddress).burnAmount = oldOwner!.burnAmount
          // for new user, no changes to updateHeight, nonce, or forwards

          // old owner loses ownership data
          oldOwner!.winHeight = 0
          oldOwner!.winTimestamp = 0
          oldOwner!.burnAmount = 0
          // nonce, forwards (not active now), update height are not touched

          console.log(
            'ownership transfered from',
            oldOwner!.address,
            'to',
            newAddress
          )
        }
      }

  return {
    permissions: st
      ? permissions.map(permission => permission(args))
      : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args,
    info,
    type,
    execute
  }
}

// Describe: If from current owner & burned past winning minimum, extend ownership.
export const currentOwnerRenewAction = (
  st: I_BnsState | null,
  address = '',
  tx: any = undefined
): I_BNS_Action => {
  const args = { st, address, tx }

  const type = BnsActionType.RENEW

  const info = 'Extend ownership of this domain'

  const permissions = [USER_IS_OWNER]

  const conditions = [
    OUTS_2,
    OUT_0,
    OUT_1,
    NOTIFIED_MIN,
    NO_UNSPENT_USER_NOTIFICATIONS_UTXO,
    USER_ADDRESS_NOT_NOTIFICATION_ADDRESS,

    BURNED_MIN,
    BURN_LAST_WIN
  ]

  const execute = !st
    ? pass
    : () => {
        const owner = getOwner(st)
        // set owner's win height to current tx height therefore updating ownership
        owner && (owner.winHeight = getTxHeight(tx))
        owner && (owner.winTimestamp = getTxTimestamp(tx))
        console.log(
          `${st.domain.domainName} : ${getTxHeight(
            tx
          )} height: owner extended ownership ${owner?.address}`
        )
      }

  return {
    permissions: st
      ? permissions.map(permission => permission(args))
      : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args,
    info,
    type,
    execute
  }
}

// Describe: update forwarding information.
export const updateForwardingInfoAction = (
  st: I_BnsState | null,
  address = '',
  tx: any = undefined
): I_BNS_Action => {
  const args = { st, address, tx }

  const type = BnsActionType.ONLY_FORWARDS

  const info = 'Only update forwarding information'

  const permissions = [
    // suggestions
    WARNING_POINTLESS_IF_NOT_OWNER
  ]

  const conditions = [
    OUTS_2,
    OUT_0,
    OUT_1,
    NOTIFIED_MIN,
    NO_UNSPENT_USER_NOTIFICATIONS_UTXO,
    USER_ADDRESS_NOT_NOTIFICATION_ADDRESS
  ]

  const execute = !st
    ? pass
    : () => {
        readEmbeddedData(st, tx)
      }

  return {
    permissions: st
      ? permissions.map(permission => permission(args))
      : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args,
    info,
    type,
    execute
  }
}

/* -------------------------------------------------------------------------- */
/*                              Automatic Actions                             */
/* -------------------------------------------------------------------------- */

// Describe: if OWNERSHIP_DURATION_BY_BLOCKS blocks since ownership update, no owner again
export const autoCheckForOwnerExpiredAction = (
  st: I_BnsState
): I_BNS_Auto_Action => {
  const args = { st }
  return {
    info: 'Existing ownerships that expire are removed',

    conditions: [EXISTS_OWNER(args), IS_OWNER_EXPIRED(args)],

    execute: () => {
      clearOwner(st)
      console.log(
        st.domain.domainName,
        getParsedHeight(st),
        'ownership expired'
      )
    }
  }
}

// Describe: always uses this tx to update derivedUtxoList of the domain notificatin address
export const updateUtxoFromTxAction = (
  st: I_BnsState,
  tx: I_TX
): I_BNS_Auto_Action => {
  return {
    info: 'Update derivedUtxoList from new tx',

    conditions: [],

    execute: () => {
      updateUtxoFromTx(st, tx)
    }
  }
}

// Describe: update bidding winner and owner
export const autoCheckForBiddingWinnerNewOwnerAction = (
  st: I_BnsState
): I_BNS_Auto_Action => {
  const args = { st }
  return {
    info: 'Derive the new owner from bidding period',

    conditions: [NO_OWNER(args), IS_BIDDING_OVER(args)],

    execute: () => {
      endBidding(st)

      console.log('bidding period is over')
    }
  }
}

const pass = () => {
  // empty function that can be executed but does nothing
}
