import { IBnsState } from './../types/'
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
  burnedPreviousRateMin
} from './../formathelpers'


// =========== AUTOMATIC PARSED ACTIONS ===========


// Expiration: if OWNERSHIP_DURATION_BY_BLOCKS blocks since ownership update, no owner again
export const autoCheckForOwnerExpired = (st: IBnsState) => ({
  name: 'autoCheckForOwnerExpired',

  conditions: [
    existsCurrentOwner(st),
    isOwnerExpired(st)
  ],

  execute: () => {
    clearOwner(st)
    console.log(st.domain.domainName, getParsedHeight(st), 'ownership expired')
  }
})

// ============ USER ACTIONs ===============

// Describe: If no owner, sender can claim ownership
export const claimOwnershipAction = (st: IBnsState, tx: any = undefined) => ({
  name: 'claimOwnershipAction',

  permissions: [
    !existsCurrentOwner(st)
  ],

  conditions: [
    atLeastTwoOutputs(tx),
    isOpreturnOutput0(tx),
    isNotify(st, tx),
    didNotifyMin(tx),

    didBurnMin(tx),
    !existsCurrentOwner(st)
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

    // set ownership to this address
    // update win height / time

    console.log(
      `${ st.domain.domainName } : ${ getTxHeight(tx) } height: new owner is ${ getUser(st, senderAddress).address }`
    )
  }
})


// Describe: If from current owner & burned past winning minimum, extend ownership.
export const currentOwnerRenewAction = (st: IBnsState, address: string, tx: any = undefined) => ({
  name: 'currentOwnerRenewAction',

  permissions: [
    isAddressTheCurrentOwner(st, address)
  ],

  conditions: [
    atLeastTwoOutputs(tx),
    isOpreturnOutput0(tx),
    isNotify(st, tx),
    didNotifyMin(tx),

    didBurnMin(tx),
    burnedPreviousRateMin(st, tx)
  ],

  execute: () => {
    const owner = getOwner(st)
    // set owner's win height to current tx height therefore updating ownership
    owner && (owner.winHeight = getTxHeight(tx))
    owner && (owner.winTimestamp = getTxTimestamp(tx))
    console.log(`${ st.domain.domainName } : ${ getTxHeight(tx) } height: owner extended ownership ${ owner?.address }`)
  }
})
