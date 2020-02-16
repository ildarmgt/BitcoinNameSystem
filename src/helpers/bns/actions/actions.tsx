import {
  I_BnsState,
  BnsActionType,
  I_BNS_Action,
  I_BNS_Auto_Action,
  I_Condition,
  I_TX,
  BnsBidType
} from './../types/'
import { MIN_NOTIFY, MIN_BURN } from './../constants'
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

const OUTS_2 = ({ tx=undefined }: any): I_Condition => ({
  status: () => atLeastTwoOutputs(tx),
  info: { describe: 'Tx must have 2+ outputs' }
})

const OUT_0 = ({ tx=undefined }: any): I_Condition => ({
  status: () => isOpreturnOutput0(tx),
  info: { describe: 'Tx must have OP_RETURN @ output[0]' }
})

const OUT_1 = ({ st, tx=undefined }: any): I_Condition => ({
  status: () => isNotify(st, tx),
  info: { describe: 'Tx must have notification address @ output[1]' }
})

const NOTIFIED_MIN = ({ tx=undefined }: any): I_Condition => ({
  status: () => didNotifyMin(tx),
  info: { describe: `Tx must have minimum ${MIN_NOTIFY} @ output[1]` }
})

const BURNED_MIN = ({ tx=undefined }: any): I_Condition => ({
  status: () => didBurnMin(tx),
  info: {
    describe: `Tx must burn ${MIN_BURN} @ output[0]`,
    set: { name: 'output 0 value', value: MIN_BURN }
  }
})

const NO_OWNER = ({ st }: any): I_Condition => ({
  status: () => !existsCurrentOwner(st),
  info: { describe: 'There must not be an existing owner' }
})

const EXISTS_OWNER = ({ st }: any): I_Condition => ({
  status: () => existsCurrentOwner(st),
  info: { describe: 'There must be existing owner' }
})

const BURN_LAST_WIN = ({ st, tx=undefined }: any): I_Condition => ({
  status: () => burnedPreviousRateMin(st, tx),
  info: {
    describe: 'Tx must burn the last ownership winning burn amount',
    set: { value: getLastOwnerBurnedValue(st), name: 'output 0 value' }
  }
})

// calculated based on tx if available, otherwise address
const USER_IS_OWNER = ({ st, address, tx=undefined }: any): I_Condition => ({
  status: () => tx ? isSenderTheCurrentOwner(st, tx) : isAddressTheCurrentOwner(st, address),
  info: { describe: `User's address must match owner's address` }

})

const IS_OWNER_EXPIRED = ({ st }: any): I_Condition => ({
  status: () => isOwnerExpired(st),
  info: { describe: 'Ownership must be expired at current parsed height' }

})

const NO_UNSPENT_USER_NOTIFICATIONS_UTXO = ({ st, tx=undefined }: any): I_Condition => ({
  status: () => noUnspentUserNotificationsUtxo(st, tx),
  info: { describe: 'There must not be any remaining notification address utxo created by sender' }
})

const USER_ADDRESS_NOT_NOTIFICATION_ADDRESS = ({ st, tx=undefined }: any): I_Condition => ({
  status: () => (getNotificationAddress(st) !== getTxInput0SourceUserAddress(tx)),
  info: { describe: 'Do not accidentally send from notification address at input[0]' }
})

const IS_COMMAND_CALLED = (
  { st, tx=undefined }: { st: I_BnsState, tx: I_TX | undefined },
  command: string
): I_Condition => ({
  status: () => (isCommandCalled(st, tx as I_TX, command)),
  info: { describe: 'Command must be present in forwards at this tx height from tx user' }
})

const IS_BIDDING_OVER = (
  { st }: { st: I_BnsState }
): I_Condition => ({
  status: () => (isBiddingOver(st)),
  info: { describe: 'The bidding period must be over but not resolved' }
})

/* -------------------------------------------------------------------------- */
/*                         Suggestions (and warnings)                         */
/* -------------------------------------------------------------------------- */

const SUGGESTION_SUBMIT_NEW_ADDRESS = ({ command }: { command: string }): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Submit your new address (forwards kept)',
    get: { value: '', name: 'newAddress' },
    command
  }
})

const SUGGESTION_SUBMIT_NEW_OWNER_ADDRESS = ({ command }: { command: string }): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Submit new owner\'s address (forwards not copied)',
    get: { value: '', name: 'newOwnerAddress' },
    command
  }
})

const WARNING_POINTLESS_IF_NOT_OWNER = (): I_Condition => ({
  status: () => true,
  info: {
    describe: 'Action not recommended for non-owners',
    warning: 'Useless unless you are the owner or will be owner in future'
  }
})

/* -------------------------------------------------------------------------- */
/*                           User's possible actions                          */
/* -------------------------------------------------------------------------- */

// Describe: If no owner, sender can start process to claim ownership
// Since autoChecks run before user action checks in calcBnsState,
// after bidding ends owner will be set by time this is checked.
export const bidForOwnershipAction = (st: I_BnsState, tx: any = undefined): I_BNS_Action => {
  const args = { st, tx }
  return {

    type: CLAIM_OWNERSHIP,
    info: 'Bid for ownership of an available domain',

    permissions: [
      // this means no more bids when there's a winner
      NO_OWNER(args)
    ],

    conditions: [
      // minimum rules to counting tx still apply for bids
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args),
      NO_UNSPENT_USER_NOTIFICATIONS_UTXO(args),
      USER_ADDRESS_NOT_NOTIFICATION_ADDRESS(args),

      // at very least minimum is burnt, the rest is derived
      BURNED_MIN(args)
    ],

    execute: () => {
      // have to start or add to bidding
      // ownership will be derived through automatic check based on bidding started here
      addBid(st, tx, BnsBidType.BURN)
    }
  }
  // need to get user input on burn amount possible minimum (general action guidance)
  // also needs some guidance for refunds necessary to win (general action guidance)
}

/**
 * Change address. (similar to send ownership, but keeps forwards)
 * network: '!ca'
 * address: 'newaddress'
 */
export const changeAddressAction = (st: I_BnsState, address: string = '', tx: any = undefined): I_BNS_Action => {
  const command = '!ca'
  const args = { st, address, tx, command }
  return {

    type: CHANGE_ADDRESS,
    info: 'Update your ownership address',

    permissions: [
      USER_IS_OWNER(args),

      // suggestions
      SUGGESTION_SUBMIT_NEW_ADDRESS(args)
    ],

    conditions: [
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args),
      NO_UNSPENT_USER_NOTIFICATIONS_UTXO(args),
      USER_ADDRESS_NOT_NOTIFICATION_ADDRESS(args),

      IS_COMMAND_CALLED(args, command)
    ],

    execute: () => {
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
  }
}

/**
 * Send ownership to another address. Forwards are not kept.
 * network: '!so'
 * address: 'newaddress'
 */
export const sendOwnershipAction = (st: I_BnsState, address: string = '', tx: any = undefined): I_BNS_Action => {
  const command = '!so'
  const args = { st, address, tx, command }
  return {

    type: SEND_OWNERSHIP,
    info: 'Give up ownership to another address',

    permissions: [
      USER_IS_OWNER(args),

      // suggestions
      SUGGESTION_SUBMIT_NEW_OWNER_ADDRESS(args)
    ],

    conditions: [
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args),
      NO_UNSPENT_USER_NOTIFICATIONS_UTXO(args),
      USER_ADDRESS_NOT_NOTIFICATION_ADDRESS(args),

      IS_COMMAND_CALLED(args, command)
    ],

    execute: () => {
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
  }
}


// Describe: If from current owner & burned past winning minimum, extend ownership.
export const currentOwnerRenewAction = (
  st: I_BnsState,
  address: string = '',
  tx: any = undefined
): I_BNS_Action => {
  const args = { st, address, tx }
  return {

    type: RENEW,
    info: 'Extend ownership of this domain',

    permissions: [
      USER_IS_OWNER(args)
    ],

    conditions: [
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args),
      NO_UNSPENT_USER_NOTIFICATIONS_UTXO(args),
      USER_ADDRESS_NOT_NOTIFICATION_ADDRESS(args),

      BURNED_MIN(args),
      BURN_LAST_WIN(args)
    ],

    execute: () => {
      const owner = getOwner(st)
      // set owner's win height to current tx height therefore updating ownership
      owner && (owner.winHeight = getTxHeight(tx))
      owner && (owner.winTimestamp = getTxTimestamp(tx))
      console.log(
        `${ st.domain.domainName } : ${ getTxHeight(tx) } height: owner extended ownership ${ owner?.address }`
      )
    }
  }
}

// Describe: update forwarding information.
export const updateForwardingInfoAction = (
  st: I_BnsState,
  address: string = '',
  tx: any = undefined
): I_BNS_Action => {
  const args = { st, address, tx }
  return {

    type: ONLY_FORWARDS,

    info: 'Only update forwarding information',

    permissions: [
      // suggestions
      WARNING_POINTLESS_IF_NOT_OWNER()
    ],

    conditions: [
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args),
      NO_UNSPENT_USER_NOTIFICATIONS_UTXO(args),
      USER_ADDRESS_NOT_NOTIFICATION_ADDRESS(args),
    ],

    execute: () => {
      readEmbeddedData(st, tx)
    }
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
