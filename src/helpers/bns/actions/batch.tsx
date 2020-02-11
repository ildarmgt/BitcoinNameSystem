import {
  currentOwnerRenewAction,
  claimOwnershipAction,
  autoCheckForOwnerExpiredAction,
  updateForwardingInfoAction,
  updateUtxoFromTxAction
} from './actions'
import { I_BnsState, I_TX, I_Condition } from './../types/'

/****************************************************************************************
 * Returns what actions are available for specific user address at current state
 */
export const runAllActionPermissionChecks = (st: I_BnsState, address: string) => {
  console.log('currentOwnerRenewAction running:')

  // Edit this list to include more actions for checks
  const allActions = [
    updateForwardingInfoAction(st, address),
    currentOwnerRenewAction(st, address),
    claimOwnershipAction(st)
  ]

  // check which actions are doable
  const checkedActions: any[] = []
  allActions.forEach(action => {

    // check each permission in each action
    const checkedPermissions: any[] = []
    action.permissions.forEach((permission: any) => {
      const isAllowed = permission.status()

      // add to list of permissions checked in this action & their display info
      checkedPermissions.push({
        isAllowed,
        info: permission.info
      })
    })

    // grab every special rule so can put together tx based on them
    const specialTxDirections: any[] = []
    action.permissions.forEach((permission: any) => {
      if ('special' in permission) specialTxDirections.push({
        info: permission.info,
        rules: permission.special
      })
    })
    action.conditions.forEach((condition: any) => {
      if ('special' in condition) specialTxDirections.push({
        info: condition.info,
        rules: condition.special
      })
    })


    // add to list of all actions with summary of all their permissions checks
    checkedActions.push({
      type: action.type,
      info: action.info,
      isUsable: checkedPermissions.every(permission => permission.isAllowed),
      warning: action.warning,
      permissionList: checkedPermissions,
      special: specialTxDirections
    })
  })

  // return array of doable actions
  return checkedActions
}

/****************************************************************************************
 * Executes all actions possible by user that sent tx.
 * Nothing returned.
 */
export const runAllUserActions = (st: I_BnsState, tx: I_TX): void => {

  // edit this list
  const allUserActions = [
    updateForwardingInfoAction(st, undefined, tx),
    currentOwnerRenewAction(st, undefined, tx),
    claimOwnershipAction(st, tx)
  ]

  allUserActions.forEach((action: any) => {

    // check that all conditions & permissions are true
    const okConditions = action.conditions.reduce(
      (areAllConditionsMet: boolean, eaCondition: any) => areAllConditionsMet && eaCondition.status()
    , true)

    const okPermissions = action.permissions.reduce(
      (areAllPermissionsMet: boolean, eaPermission: any) => areAllPermissionsMet && eaPermission.status()
    , true)

    if (okConditions && okPermissions) action.execute()
  })
}

/****************************************************************************************
 * Executes non-user actions like ownership expiration over time or deriving new UTXO.
 * Nothing returned.
 */
export const runAllAutomaticActions = (st: I_BnsState, tx: I_TX | undefined): void => {

  // list of all automatic actions
  const allAutoChecks = [
    autoCheckForOwnerExpiredAction(st),
    tx ? updateUtxoFromTxAction(st, tx) : undefined
  ]

  allAutoChecks.forEach(action => {
    if (!!action) {
      // check that all conditions are true
      const ok = action.conditions.reduce(
        (areAllConditionsMet: boolean, eaCondition: I_Condition ) => (
          areAllConditionsMet && eaCondition.status()
        ), true)
      if (ok) action.execute()
    }
  })
}


