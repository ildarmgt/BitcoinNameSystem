import {
  currentOwnerRenewAction,
  claimOwnershipAction,
  autoCheckForOwnerExpired
} from './actions'
import { IBnsState } from './../types/'
import { getTxInput0SourceUserAddress } from './../formathelpers'

// =========== batch checks and execute ==============

export const runAllPermissionChecks = (st: IBnsState, address: string) => {
  const allActions = [
    currentOwnerRenewAction(st, address),
    claimOwnershipAction(st)
  ]

  allActions.forEach(action => {
    // check that all conditions are true
    const ok = action.permissions.reduce((areAllPermissionsMet, eaPermission) => areAllPermissionsMet && eaPermission, true)
    return ok
  })
}

export const runAllUserActions = (st: IBnsState, tx: any) => {
  const allUserActions = [
    currentOwnerRenewAction(st, getTxInput0SourceUserAddress(tx), tx),
    claimOwnershipAction(st, tx)
  ]

  allUserActions.forEach(action => {

    // check that all conditions & permissions are true
    const okConditions = action.conditions.reduce(
      (areAllConditionsMet: boolean, eaCondition: boolean) => areAllConditionsMet && eaCondition
    , true)

    const okPermissions = action.permissions.reduce(
      (areAllPermissionsMet: boolean, eaPermission: boolean) => areAllPermissionsMet && eaPermission
    , true)

    if (okConditions && okPermissions) action.execute()

  })
}


export const runAllAutomaticChecks = (st: IBnsState) => {

  // list of all automatic actions
  const allAutoChecks = [
    autoCheckForOwnerExpired(st)
  ]

  allAutoChecks.forEach(action => {
    // check that all conditions are true
    const ok = action.conditions.reduce((areAllConditionsMet, eaCondition) => areAllConditionsMet && eaCondition, true)
    if (ok) action.execute()
  })
}


