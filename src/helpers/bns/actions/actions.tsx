import {
  I_BnsState,
  BNSActions,
  I_BNS_Action,
  I_BNS_Auto_Action,
  I_Condition,
  I_TX
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
  getTxOutput0BurnValue,
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
  createNewUser
} from './../formathelpers'
const { RENEW, ONLY_FORWARDS, CLAIM_OWNERSHIP, SEND_OWNERSHIP, CHANGE_ADDRESS } = BNSActions

// =========== CONDITIONS / PERMISSIONS ================
// Called by the actions for conditions
// Return object with "info": describing condition (accessible w/o tx),
// "status" to check conditoin (accessible w/o tx),
// and optional "special" to give transaction forming specifications (accessible w/o tx)

const OUTS_2 = ({ tx=undefined }: any): I_Condition => ({
  info: 'Tx must have 2+ outputs',
  status: () => atLeastTwoOutputs(tx)
})

const OUT_0 = ({ tx=undefined }: any): I_Condition => ({
  info: 'Tx must have OP_RETURN @ output[0]',
  status: () => isOpreturnOutput0(tx)
})

const OUT_1 = ({ st, tx=undefined }: any): I_Condition => ({
  info: 'Tx must have notification address @ output[1]' ,
  status: () => isNotify(st, tx)
})

const NOTIFIED_MIN = ({ tx=undefined }: any): I_Condition => ({
  info: `Tx must have minimum ${MIN_NOTIFY} @ output[1]`,
  status: () => didNotifyMin(tx)
})

const BURNED_MIN = ({ tx=undefined }: any): I_Condition => ({
  info: `Tx must burn ${MIN_BURN} @ output[0]`,
  status: () => didBurnMin(tx),
  special: { output0value: MIN_BURN }
})

const NO_OWNER = ({ st }: any): I_Condition => ({
  info: 'There must not be an existing owner',
  status: () => !existsCurrentOwner(st)
})

const EXISTS_OWNER = ({ st }: any): I_Condition => ({
  info: 'There must be existing owner',
  status: () => existsCurrentOwner(st)
})

const BURN_LAST_WIN = ({ st, tx=undefined }: any): I_Condition => ({
  info: 'Tx must burn the last ownership winning burn amount',
  status: () => burnedPreviousRateMin(st, tx),
  special: { output0value: getLastOwnerBurnedValue(st) }
})

// calculated based on tx if available, otherwise address
const USER_IS_OWNER = ({ st, address, tx=undefined }: any): I_Condition => ({
  info: `User's address must match owner's address`,
  status: () => tx ? isSenderTheCurrentOwner(st, tx) : isAddressTheCurrentOwner(st, address)
})

const IS_OWNER_EXPIRED = ({ st }: any): I_Condition => ({
  info: 'Ownership must be expired at current parsed height',
  status: () => isOwnerExpired(st)
})

const NO_UNSPENT_USER_NOTIFICATIONS_UTXO = ({ st, tx=undefined }: any): I_Condition => ({
  info: 'There must not be any remaining notification address utxo created by sender',
  status: () => noUnspentUserNotificationsUtxo(st, tx),
  special: { inputs: 'NO_USER_NOTIFICATION_UTXO' }
})

const USER_ADDRESS_NOT_NOTIFICATION_ADDRESS = ({ st, tx=undefined }: any): I_Condition => ({
  info: 'Do not accidentally send from notification address at input[0]',
  status: () => (getNotificationAddress(st) !== getTxInput0SourceUserAddress(tx))
})

const IS_COMMAND_CALLED = (
  { st, tx=undefined }: { st: I_BnsState, tx: I_TX | undefined },
  command: string
): I_Condition => ({
  info: 'Command must be present in forwards at this tx height from tx user',
  status: () => (isCommandCalled(st, tx as I_TX, command))
})




// ============ USER ACTIONs ===============

/**
 * Change address. (similar to send ownership, but keeps forwards)
 * network: '!ca'
 * address: 'newaddress'
 */
export const changeAddressAction = (st: I_BnsState, address: string = '', tx: any = undefined): I_BNS_Action => {
  const args = { st, address, tx }
  const commandSignal = '!ca'
  return {

    type: CHANGE_ADDRESS,
    info: 'Update your ownership address',

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

      IS_COMMAND_CALLED(args, commandSignal)
    ],

    execute: () => {
      const thisCommand = getCommandCalled(st, tx, commandSignal)
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
    },

    // change from tx for user could be sent to the new address
    // so there's no need to fund new address or withdraw from old one
    suggestions: 'GET_Your new address (change sent there)_' + commandSignal
  }
}

/**
 * Send ownership to another address. Forwards are not kept.
 * network: '!so'
 * address: 'newaddress'
 */
export const sendOwnershipAction = (st: I_BnsState, address: string = '', tx: any = undefined): I_BNS_Action => {
  const args = { st, address, tx }
  const commandSignal = '!so'
  return {

    type: SEND_OWNERSHIP,
    info: 'Send ownership to another address',

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

      IS_COMMAND_CALLED(args, commandSignal)
    ],

    execute: () => {
      const thisCommand = getCommandCalled(st, tx, commandSignal)
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
    },
    suggestions: 'GET_New owner address_' + commandSignal
  }
}


// Describe: If no owner, sender can claim ownership
export const claimOwnershipAction = (st: I_BnsState, tx: any = undefined): I_BNS_Action => {
  const args = { st, tx }
  return {

    type: CLAIM_OWNERSHIP,
    info: 'Claim ownership of an available domain',

    permissions: [
      NO_OWNER(args)
    ],

    conditions: [
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args),
      NO_UNSPENT_USER_NOTIFICATIONS_UTXO(args),
      USER_ADDRESS_NOT_NOTIFICATION_ADDRESS(args),

      BURNED_MIN(args)
    ],

    execute: () => {
      // ownership source was already created for sure via updateSourceUserFromTx
      // only have to set owner address to tx address
      const height = getTxHeight(tx)
      const senderAddress =  getTxInput0SourceUserAddress(tx)
      setOwner(st, senderAddress)
      getUser(st, senderAddress).winHeight = height
      getUser(st, senderAddress).winTimestamp = getTxTimestamp(tx)
      getUser(st, senderAddress).burnAmount = getTxOutput0BurnValue(tx)
      console.log(
        `${ st.domain.domainName } : ${ getTxHeight(tx) } height: new owner is ${ getUser(st, senderAddress).address }`
      )
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

    permissions: [],

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
    },

    // Change info to warning when attempting to update forwarding info
    // for domain you do not control.
    // Such a change would be wasted until it's owned.
    suggestions:
      !USER_IS_OWNER(args).status()
        ? 'WARNING_USELESS_IF_NOT_OWNER'
        : undefined
  }
}

// =========== AUTOMATIC PARSED ACTIONS NOT BY USERS (e.g. TIME BASED) ===========

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