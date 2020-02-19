import {
  I_BnsState,
  BnsActionType,
  I_BNS_Action,
  I_BNS_Auto_Action,
  I_Condition,
  I_TX,
  BnsBidType
} from './../types/'
import {
  MIN_NOTIFY,
  MIN_BURN,
  CHALLENGE_MIN_MULTIPLY
} from './../constants'
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
  endBidding
} from './../formathelpers'
const {
  RENEW,
  ONLY_FORWARDS,
  CLAIM_OWNERSHIP,
  SEND_OWNERSHIP,
  CHANGE_ADDRESS
} = BnsActionType


/* -------------------------------------------------------------------------- */
/*                          Conditoins / Permissions                          */
/* -------------------------------------------------------------------------- */

// Called by the actions for conditions
// Return object with "info": describing condition (accessible w/o tx),
// "status" to check conditoin (accessible w/o tx),
// and optional "special" to give transaction forming specifications (accessible w/o tx)

const OUTS_2 = ({ tx=undefined }: any = {}): I_Condition => ({
  status: () => atLeastTwoOutputs(tx),
  info: { describe: 'Tx must have 2+ outputs' }
})

const OUT_0 = ({ tx=undefined }: any = {}): I_Condition => ({
  status: () => isOpreturnOutput0(tx),
  info: { describe: 'Tx must have OP_RETURN @ output[0]' }
})

const OUT_1 = ({ st, tx=undefined }: any = {}): I_Condition => ({
  status: () => isNotify(st, tx),
  info: { describe: 'Tx must have notification address @ output[1]' }
})

const NOTIFIED_MIN = ({ tx=undefined }: any = {}): I_Condition => ({
  status: () => didNotifyMin(tx),
  info: {
    describe: `Notification output amount must not be lower than the minimum`,
    set: { name: 'Notification minimum', value: MIN_NOTIFY, units: 'satoshi' }
  }
})

const BURNED_MIN = ({ tx=undefined }: any = {}): I_Condition => ({
  status: () => didBurnMin(tx),
  info: {
    describe: `Tx must burn (bid) at least the minimum amount`,
    set: { name: 'output 0 value', value: MIN_BURN, units: 'satoshi' }
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

const BURN_LAST_WIN = ({ st, tx=undefined }: any = {}): I_Condition => ({
  status: () => burnedPreviousRateMin(st, tx),
  info: {
    describe: 'Tx must burn the last ownership winning burn amount',
    set: { value: getLastOwnerBurnedValue(st), name: 'output 0 value' }
  }
})

// calculated based on tx if available, otherwise address
const USER_IS_OWNER = ({ st, address, tx=undefined }: any = {}): I_Condition => ({
  status: () => tx ? isSenderTheCurrentOwner(st, tx) : isAddressTheCurrentOwner(st, address),
  info: { describe: `User's address must match owner's address` }

})

const IS_OWNER_EXPIRED = ({ st }: any = {}): I_Condition => ({
  status: () => isOwnerExpired(st),
  info: { describe: 'Ownership must be expired at current parsed height' }

})

const NO_UNSPENT_USER_NOTIFICATIONS_UTXO = ({ st, tx=undefined }: any = {}): I_Condition => ({
  status: () => noUnspentUserNotificationsUtxo(st, tx),
  info: { describe: 'There must not be any remaining notification address utxo created by sender' }
})

// easy mistake to make
const USER_ADDRESS_NOT_NOTIFICATION_ADDRESS = ({ st, tx=undefined }: any = {}): I_Condition => ({
  status: () => (getNotificationAddress(st) !== getTxInput0SourceUserAddress(tx)),
  info: { describe: 'Do not accidentally send from notification address at input[0]' }
})

const IS_COMMAND_CALLED = ({ st, command, tx=undefined }: any = {}): I_Condition => ({
  status: () => (isCommandCalled(st, tx as I_TX, command)),
  info: { describe: 'Checks forwards for a specific command issued at this height' }
})

const IS_BIDDING_OVER = ({ st }: any = {}): I_Condition => ({
  status: () => (isBiddingOver(st)),
  info: { describe: 'The bidding period must be over but not resolved' }
})

/* -------------------------------------------------------------------------- */
/*                         Suggestions (and warnings)                         */
/* -------------------------------------------------------------------------- */

const SUGGESTION_SUBMIT_NEW_ADDRESS = ({ command }: any = {}): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Submit your new address (forwards are kept)',
    get: { value: '', name: 'Your new address' },
    command
  }
})

const SUGGESTION_SUBMIT_NEW_OWNER_ADDRESS = ({ command }: any = {}): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Submit new owner\'s address (forwards are not copied)',
    get: { value: '', name: 'New owner\'s address' },
    command
  }
})

const SUGGESTION_SUBMIT_BURN_AMOUNT = ({ st }: any = {}): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Submit your bid burn amount',
    get: {
      value: '',
      name: 'Bid burn amount' ,
      // good guess for min next bid is CHALLENGE_MIN_MULTIPLY x (highest known bid)
      // assuming they all meet the rules  by end of bidding
      min: !st
        ? undefined
        // when state provided
        : (
            // and there are existing bids
            st.domain.bidding.bids.length > 0
              // return the highest of the bids
              ? Math.max(...st.domain.bidding.bids.map((bid: any) => bid.value)) * CHALLENGE_MIN_MULTIPLY
              // otherwise return burn minimum
              : MIN_BURN
        ),
      units: 'satoshi'
    }
  }
})

/**
 * Need a way to suggest refunds and how much but not force it.
 */
// const SUGGESTION_REFUND_PAST_BIDDERS = ({ st }: any = {}): I_Condition => ({

// })


const WARNING_POINTLESS_IF_NOT_OWNER = (args: any): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Action not recommended for non-owners',
    warning: !USER_IS_OWNER(args)?.status() ? 'Useless unless you are the owner or will be owner in future' : undefined
  }
})

/* -------------------------------------------------------------------------- */
/*                           User's possible actions                          */
/* -------------------------------------------------------------------------- */

// Describe: If no owner, sender can start process to claim ownership
// Since autoChecks run before user action checks in calcBnsState,
// after bidding ends owner will be set by time this is checked.
export const bidForOwnershipAction = (st: I_BnsState | null, tx: any = undefined): I_BNS_Action => {

  const args = { st, tx }

  const type = CLAIM_OWNERSHIP

  const info = 'Bid for ownership of a domain'

  const permissions = [
    // this means no more bids when there's a winner
    NO_OWNER,

    // suggestions
    SUGGESTION_SUBMIT_BURN_AMOUNT
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

  const execute = !st ? () => {} : () => {
    // have to start or add to bidding
    // ownership will be derived through automatic check based on bidding started here
    addBid(st, tx, BnsBidType.BURN)
  }

  return {
    permissions: st ? permissions.map(permission => permission(args)) : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args, info, type, execute
  }

  // need to get user input on burn amount possible minimum (general action guidance)
  // also needs some guidance for refunds necessary to win (general action guidance)

}

/**
 * Change address. (similar to send ownership, but keeps forwards)
 * network: '!ca'
 * address: 'newaddress'
 */
export const changeAddressAction = (st: I_BnsState | null, address: string = '', tx: any = undefined): I_BNS_Action => {

  const command = '!ca'

  const args = { st, address, tx, command }

  const type = CHANGE_ADDRESS

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

  const execute = !st ? () => {} : () => {
    const thisCommand = getCommandCalled(st, tx, command)
    const newAddress = thisCommand?.address;
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
      getUser(st, newAddress).forwards = JSON.parse(JSON.stringify(oldOwner!.forwards))
      // for new user, no changes to updateHeight, nonce

      // old owner loses ownership data
      oldOwner!.winHeight = 0
      oldOwner!.winTimestamp = 0
      oldOwner!.burnAmount = 0
      // nonce, forwards (not active now), update height are not touched
      console.log('ownership transfered from', oldOwner!.address, 'to', newAddress)
    }
  }

  return {
    permissions: st ? permissions.map(permission => permission(args)) : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args, info, type, execute
  }
}

/**
 * Send ownership to another address. Forwards are not kept.
 * network: '!so'
 * address: 'newaddress'
 */
export const sendOwnershipAction = (st: I_BnsState | null, address: string = '', tx: any = undefined): I_BNS_Action => {

  const command = '!so'

  const args = { st, address, tx, command }

  const type = SEND_OWNERSHIP

  const info = 'Give up ownership to another address'

  const permissions = [
    USER_IS_OWNER,

    // suggestions
    SUGGESTION_SUBMIT_NEW_OWNER_ADDRESS,
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

  const execute = !st ? () => {} : () => {
    const thisCommand = getCommandCalled(st, tx, command)
    const newAddress = thisCommand?.address;
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

      console.log('ownership transfered from', oldOwner!.address, 'to', newAddress)
    }
  }

  return {
    permissions: st ? permissions.map(permission => permission(args)) : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args, info, type, execute
  }

}


// Describe: If from current owner & burned past winning minimum, extend ownership.
export const currentOwnerRenewAction = (
  st: I_BnsState | null,
  address: string = '',
  tx: any = undefined
): I_BNS_Action => {

  const args = { st, address, tx }

  const type = RENEW

  const info = 'Extend ownership of this domain'

  const permissions = [
    USER_IS_OWNER
  ]

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

  const execute = !st ? () => {} : () => {
    const owner = getOwner(st)
    // set owner's win height to current tx height therefore updating ownership
    owner && (owner.winHeight = getTxHeight(tx))
    owner && (owner.winTimestamp = getTxTimestamp(tx))
    console.log(
      `${ st.domain.domainName } : ${ getTxHeight(tx) } height: owner extended ownership ${ owner?.address }`
    )
  }

  return {
    permissions: st ? permissions.map(permission => permission(args)) : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args, info, type, execute
  }
}

// Describe: update forwarding information.
export const updateForwardingInfoAction = (
  st: I_BnsState | null,
  address: string = '',
  tx: any = undefined
): I_BNS_Action => {

  const args = { st, address, tx }

  const type = ONLY_FORWARDS

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

  const execute = !st ? () => {} : () => {
    readEmbeddedData(st, tx)
  }

  return {
    permissions: st ? permissions.map(permission => permission(args)) : permissions,
    conditions: st ? conditions.map(condition => condition(args)) : conditions,
    args, info, type, execute
  }
}

/* -------------------------------------------------------------------------- */
/*                              Automatic Actions                             */
/* -------------------------------------------------------------------------- */

// Describe: if OWNERSHIP_DURATION_BY_BLOCKS blocks since ownership update, no owner again
export const autoCheckForOwnerExpiredAction = (st: I_BnsState): I_BNS_Auto_Action => {
  const args = { st }
  return {
    info: 'Existing ownerships that expire are removed',

    conditions: [
      EXISTS_OWNER(args),
      IS_OWNER_EXPIRED(args)
    ],

    execute: () => {
      clearOwner(st)
      console.log(st.domain.domainName, getParsedHeight(st), 'ownership expired')
    }
  }
}

// Describe: always uses this tx to update derivedUtxoList of the domain notificatin address
export const updateUtxoFromTxAction = (st: I_BnsState, tx: I_TX): I_BNS_Auto_Action => {
  return {
    info: 'Update derivedUtxoList from new tx',

    conditions: [],

    execute: () => {
      updateUtxoFromTx(st, tx)
    }
  }
}

// Describe: update bidding winner and owner
export const autoCheckForBiddingWinnerNewOwnerAction = (st: I_BnsState): I_BNS_Auto_Action => {
  const args = { st }
  return {
    info: 'Derive the new owner from bidding period',

    conditions: [
      NO_OWNER(args),
      IS_BIDDING_OVER(args)
    ],

    execute: () => {
      endBidding(st)

      console.log('bidding period is over')
    }
  }
}
