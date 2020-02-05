import {
  currentOwnerRenewAction,
  claimOwnershipAction,
  autoCheckForOwnerExpired,
  updateForwardingInfoAction
} from './actions'
import { IBnsState } from './../types/'
import {
  getTxInput0SourceUserAddress
} from './../formathelpers'

/****************************************************************************************
 * Returns what actions are available for specific user address at current state
 */
export const runAllActionPermissionChecks = (st: IBnsState, address: string) => {

  // Edit this list to include more actions for checks
  const allActions = [
    updateForwardingInfoAction(st),
    currentOwnerRenewAction(st, address),
    claimOwnershipAction(st)
  ]

  // check which actions are doable
  const checkedActions: any[] = []
  allActions.forEach(action => {

    // check each permission in each action
    const checkedPermissions: any[] = []
    action.permissions().forEach((permission: any) => {
      const isAllowed = permission.status

      // add to list of permissions checked in this action & their display info
      checkedPermissions.push({
        isAllowed,
        info: permission.info
      })
    })

    // add to list of all actions with summary of all their permissions checks
    checkedActions.push({
      info: action.info,
      isUsable: checkedPermissions.every(permission => permission.isAllowed),
      permissionList: checkedPermissions
    })
  })

  // return array of doable actions
  return checkedActions
}

/****************************************************************************************
 * Executes all actions possible by user that sent tx.
 * Nothing returned.
 */
export const runAllUserActions = (st: IBnsState, tx: any) => {

  // edit this list
  const allUserActions = [
    updateForwardingInfoAction(st, tx),
    currentOwnerRenewAction(st, getTxInput0SourceUserAddress(tx), tx),
    claimOwnershipAction(st, tx)
  ]

  allUserActions.forEach((action: any) => {

    // check that all conditions & permissions are true
    const okConditions = action.conditions().reduce(
      (areAllConditionsMet: boolean, eaCondition: any) => areAllConditionsMet && eaCondition.status
    , true)

    const okPermissions = action.permissions().reduce(
      (areAllPermissionsMet: boolean, eaPermission: any) => areAllPermissionsMet && eaPermission.status
    , true)

    if (okConditions && okPermissions) action.execute()
  })
}

/****************************************************************************************
 * Executes non-user actions like ownership expiration over time.
 * Nothing returned.
 */
export const runAllAutomaticChecks = (st: IBnsState) => {

  // list of all automatic actions
  const allAutoChecks = [
    autoCheckForOwnerExpired(st)
  ]

  allAutoChecks.forEach(action => {
    // check that all conditions are true
    const ok = action.conditions().reduce((areAllConditionsMet, eaCondition) => areAllConditionsMet && eaCondition.status, true)
    if (ok) action.execute()
  })
}


