import {
  currentOwnerRenewAction,
  bidForOwnershipAction,
  autoCheckForOwnerExpiredAction,
  updateForwardingInfoAction,
  updateUtxoFromTxAction,
  sendOwnershipAction,
  changeAddressAction,
  autoCheckForBiddingWinnerNewOwnerAction
} from './actions'
import { I_BnsState, I_TX, I_Condition } from './../types/'




/**
 * Returns what actions are available for specific user address at current state.
 */
export const runAllActionPermissionChecks = (st: I_BnsState, address: string) => {
  console.log('currentOwnerRenewAction running:')

  // Edit this list to include more actions for checks
  // (address here only at best, tx not necessary or possible)
  const allActions = [
    updateForwardingInfoAction(st, address),
    currentOwnerRenewAction(st, address),
    bidForOwnershipAction(st),

    sendOwnershipAction(st, address),
    changeAddressAction(st, address)
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
        ...permission
      })
    })

    // grab every condition (for info)
    const actionSuggestions: any[] = []
    action.permissions.forEach((permission: any) => {
      actionSuggestions.push(permission)
    })
    action.conditions.forEach((condition: any) => {
      actionSuggestions.push(condition)
    })


    // add to list of all actions with summary of all their permissions checks
    checkedActions.push({
      type: action.type,
      info: action.info,
      isUsable: checkedPermissions.every(permission => permission.isAllowed),
      permissionList: checkedPermissions,
      suggestions: actionSuggestions
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

  // edit this list (tx here, address not necessary)
  const allUserActions = [
    updateForwardingInfoAction(st, undefined, tx),  // reads embedded data
    currentOwnerRenewAction(st, undefined, tx),     // renew ownership
    bidForOwnershipAction(st, tx),                   // new ownership

    // giving up ownership should go last in case user state needs to be edited first
    sendOwnershipAction(st, undefined, tx),         // give up ownership to another
    changeAddressAction(st, undefined, tx)          // change your ownership address
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
    tx ? updateUtxoFromTxAction(st, tx) : undefined,
    autoCheckForBiddingWinnerNewOwnerAction(st)
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

/****************************************************************************************
 * Simply returns all user actions without any fed parameters
 */
export const scanEveryActionForCommand = () => {
  // list of all actions to check
  const actions = [
    updateForwardingInfoAction(null),
    currentOwnerRenewAction(null),
    bidForOwnershipAction(null),

    sendOwnershipAction(null),
    changeAddressAction(null)
  ]
  return actions
}

// (TODO) rewrite so don't have to list same user actiosn 5 times w/ diff arguments, more generalized