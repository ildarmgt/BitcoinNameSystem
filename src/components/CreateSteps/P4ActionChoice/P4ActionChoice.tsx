import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ActionChoice.module.css'
import { Store } from '../../../store'
import { changePageInfoAction, changeChoicesBNSAction } from '../../../store/actions'
import { Details } from './../../general/Details'
import { runAllActionPermissionChecks, calcBnsState } from './../../../helpers/bns/'
import { InputForm } from './../../general/InputForm'

/**
 * Bid on network
 */
export const P4ActionChoice = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // simulate bns state once again just in case
  // up to current block height
  const bns = calcBnsState(
    state.domain.txHistory,
    state.domain.domainName,
    state.chain.height,
    state.network
  )
  // and get all permissions
  const checkActions = runAllActionPermissionChecks(bns, state.wallet.address)
  console.log('results of permission scan for all actions', checkActions)

  // local state for special cases where form needs to be shown for extra data
  const [dataExtraForm, setDataExtraForm] = React.useState()
  // only runs when available actions change
  React.useEffect(() => {
    // only do if undefined local state (once)
    if (!dataExtraForm) {
      // go through each action, set key to .info and set show status to false
      let showStatus: { [key: string]: {show: boolean, value: string} } = {}
      checkActions.forEach(action => {
        showStatus[action.info] = { show: false, value: '' }
      })
      setDataExtraForm(showStatus)
    }
  }, [checkActions, dataExtraForm])

  // list available actions for render
  const listAvailableActions = () => (
    checkActions.map(action => {
      // usable actions only + not displaying actions with warnings
      if (action.isUsable && !action.suggestions?.startsWith('WARNING')) {
        console.log(action.info, 'special tx instructions:', action.special)
        return (
          <div key={ action.info }>
            <RoundButton
              next={ !action.suggestions?.startsWith('GET') ? 'true' : undefined }
              onClick={ () => {
                if (!action.suggestions?.startsWith('GET')) {
                  // if regular action without extra data needed

                  // set this action as the chosen action
                  changeChoicesBNSAction(state, dispatch, {
                    action: JSON.parse(JSON.stringify(action))
                  })
                  // change page
                  changePageInfoAction(state, dispatch, 5)
                } else {
                  // if special action with extra data needed, toggle showing form instead
                  if (dataExtraForm) {
                    const { show, value } = dataExtraForm[action.info]
                    setDataExtraForm({ ...dataExtraForm, [action.info]: { show: !show, value } })
                  }
                }
              }}
            >
              { action.info }
              { action.suggestions?.startsWith('GET') ? ' ...' : '' }
            </RoundButton>
            { (dataExtraForm && dataExtraForm[action.info].show) && (
              <InputForm
                // style={ { width: '50%' } }
                className={ styles.inputForms }
                // label title comes from 3rd substring separarted by _
                thisInputLabel={ action.suggestions.split('_')[1] }
                // parameter name comes from 2nd word separated by _
                thisInputValue={ dataExtraForm[action.info].value }
                thisInputOnChange={ (e: any) => {
                  // add changed value to extra form state
                  setDataExtraForm({
                    ...dataExtraForm,
                    [action.info]: {
                      ...dataExtraForm[action.info],
                      value: e.target.value
                    }
                  })
                } }
                thisSubmitButtonOnClick={ () => {

                  if (dataExtraForm[action.info].value !== '') {
                    const actionCommandText = action.suggestions.split('_')[2]

                    // set this action as the chosen action in global state
                    // add onto it the command (e.g. '!ca'), space, and then form value
                    changeChoicesBNSAction(state, dispatch, {
                      action: {
                        ...action,
                        actionContent: actionCommandText + ' ' + dataExtraForm[action.info].value
                      }
                    })
                    // change page
                    changePageInfoAction(state, dispatch, 5)
                  }
                } }
              />
            ) }
          </div>
        )
      } else {
        return ''
      }
    })
  )

  // list unavailable actions for render
  const listUnavailableActions = () => (
    checkActions.map(action => {
      if (!action.isUsable) {
        return (
          <div
            className={
              styles.unavailableActions__actionList__action
            }
            key={ action.info }
          >
            <div
              className={
                styles.unavailableActions__actionList__action__title
              }
            >
              { action.info }
            </div>
            <div
              className={
                styles.unavailableActions__actionList__action__permissionList
              }
            >
              { action.permissionList.map((permission: any) => {
                return (
                  <div
                    className={
                      styles.unavailableActions__actionList__action__permissionList__permission
                    }
                    key={permission.info}
                  >
                    - { permission.info }
                  </div>
                )
              })}
            </div>
          </div>
        )
      } else {
        return ('')
      }
    })
  )

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Available actions
      </div>
      <div className={ styles.availableActions }>
        {
          listAvailableActions()
        }
      </div>
      <div className={ styles.unavailableActions }>
        <Details
          description={ 'Show unavailable actions' }
          className= { styles.unavailableActions__title }
        >
          <div className={ styles.unavailableActions__actionList }>
            {
              listUnavailableActions()
            }
          </div>
        </Details>
      </div>
      <div className={ styles.buttonWrapper }>
        <RoundButton
          back='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 3)
          }}
        >
          Back
        </RoundButton>
      </div>
    </div>
  )
}