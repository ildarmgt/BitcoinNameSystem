import { IBnsState, BNSActions } from './../types/'
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
  getLastOwnerBurnedValue
} from './../formathelpers'
const { RENEW, ONLY_FORWARDS, CLAIM_OWNERSHIP } = BNSActions

// =========== CONDITIONS / PERMISSIONS ================
// Called by the actions for conditions
// Return object with "info": describing condition,
// "status" to check conditoin,
// and optional "special" to give transaction forming specifications

const OUTS_2 = ({ tx=undefined }: any) => ({
  info: 'Tx must have 2+ outputs',
  status: () => atLeastTwoOutputs(tx)
})

const OUT_0 = ({ tx=undefined }: any) => ({
  info: 'Tx must have OP_RETURN @ output[0]',
  status: () => isOpreturnOutput0(tx)
})

const OUT_1 = ({ st, tx=undefined }: any) => ({
  info: 'Tx must have notification address @ output[1]' ,
  status: () => isNotify(st, tx)
})

const NOTIFIED_MIN = ({ tx=undefined }: any) => ({
  info: `Tx must have minimum ${MIN_NOTIFY} @ output[1]`,
  status: () => didNotifyMin(tx)
})

const BURNED_MIN = ({ tx=undefined }: any) => ({
  info: `Tx must burn ${MIN_BURN} @ output[0]`,
  status: () => didBurnMin(tx),
  special: { output0value: MIN_BURN }
})

const NO_OWNER = ({ st }: any) => ({
  info: 'There must not be an existing owner',
  status: () => !existsCurrentOwner(st)
})

const EXISTS_OWNER = ({ st }: any) => ({
  info: 'There must be existing owner',
  status: () => existsCurrentOwner(st)
})

const BURN_LAST_WIN = ({ st, tx=undefined }: any) => ({
  info: 'Tx must burn the last ownership winning burn amount',
  status: () => burnedPreviousRateMin(st, tx),
  special: { output0value: getLastOwnerBurnedValue(st) }
})

const USER_IS_OWNER = ({ st, address=undefined }: any) => ({
  info: `User's address must match owner's address`,
  status: () => isAddressTheCurrentOwner(st, address)
})

const IS_OWNER_EXPIRED = ({ st }: any) => ({
  info: 'Ownership must be expired at current parsed height',
  status: () => isOwnerExpired(st)
})


// ============ USER ACTIONs ===============

// Describe: If no owner, sender can claim ownership
export const claimOwnershipAction = (st: IBnsState, tx: any = undefined) => {
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
  st: IBnsState,
  address: string,
  tx: any = undefined
) => {
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
  st: IBnsState,
  tx: any = undefined
) => {
  const args = { st, tx }
  return {

    type: ONLY_FORWARDS,
    info: "Only update forwarding information",

    permissions: [],

    conditions: [
      OUTS_2(args),
      OUT_0(args),
      OUT_1(args),
      NOTIFIED_MIN(args)
    ],

    execute: () => {
      readEmbeddedData(st, tx)
    }
  }
}

// =========== AUTOMATIC PARSED ACTIONS NOT BY USERS (e.g. TIME BASED) ===========

// Describe: if OWNERSHIP_DURATION_BY_BLOCKS blocks since ownership update, no owner again
export const autoCheckForOwnerExpired = (st: IBnsState) => {
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