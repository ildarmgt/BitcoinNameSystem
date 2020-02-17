import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ActionChoice.module.css'
import { Store } from '../../../store'
import { changePageInfoAction, changeChoicesBNSAction } from '../../../store/actions'
import { Details } from './../../general/Details'
import { runAllActionPermissionChecks, calcBnsState } from './../../../helpers/bns/'
import { InputForm } from './../../general/InputForm'
import sanitize from '../../../helpers/sanitize'

/**
 * Bid on network.
 */
export const P4ActionChoice = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // local state for special cases where form is attempting to get data from user
  const [extraFormData, setExtraFormData] = React.useState()
  // local state for permission scan so can be used directly and becomes reactive
  const [checkActions, setCheckActions] = React.useState()

  // calculate and get all permissions (once)
  if (!checkActions) {
    // simulate bns state once again just in case
    // up to current block height
    const bns = calcBnsState(
      state.domain.txHistory,
      state.domain.domainName,
      state.chain.height,
      state.network
    )
    setCheckActions(runAllActionPermissionChecks(bns, state.wallet.address))
  }

  // help with understanding a get suggestion
  const getSuggestInfo = (getSuggestion: any) => {
    const get = getSuggestion.info.get
    const network = state.network
    const units = get.units
    const min = get.min
    const type = min ? 'number' : 'string'

    // min suggestions it's a number
    if (min) {

      // if satoshi, convert to btc
      const finalMin = units === 'satoshi' ? min / 1.0e8 : min
      const finalUnitsName = network === 'testnet' ? 'tBTC' : 'BTC'

      return {
        value: '' + get.value, // raw value as string
        finalMin: finalMin.toFixed(8), // min in BTC
        type,
        units: finalUnitsName,
        // always entering in BTC
        // so convert to satoshi if units are satoshi
        // otherwise leave alone
        // store as string
        finalValue: () => {
          if (units === 'satoshi') {
            const sanitizeValue = sanitize(get.value, ['decimal_point', 'numbers'])
            return String(Math.round(parseFloat(sanitizeValue) * 1.0e8)) // to sats
          }
          return get.value // sats
        }
      }
    }

    return {
      type,
      value: get.value
    }
  }

  // initializes extra form status from permission checks
  React.useEffect(() => {
    // only do if undefined local state (once)
    if (!extraFormData) {
      // go through each action, set key to .info and set show status to false
      const showStatus: { [key: string]: { show: boolean } } = {}
      checkActions.forEach((action: any) => {
        showStatus[action.info] = { show: false }
      })
      setExtraFormData(showStatus)
    }
  }, [checkActions, extraFormData])

  // list available actions for render
  const listAvailableActions = () => (
    !!checkActions && checkActions.map((action: any) => {
      // usable actions only
      if (action.isUsable) {
        // abort if it has even 1 warning as well
        if (action.suggestions.some((suggestion: any) => suggestion.info.warning)) return ''
        // check if there's data needed from user for this action
        const suggestionsToGet = action.suggestions.filter((suggestion: any) => ('get' in suggestion.info)) || []

        return (
          // action div start
          <div key={ action.info }>
            {/* change what action button does based on if there's data to get */}
            <RoundButton
              next={ suggestionsToGet.length === 0 ? 'true' : undefined }
              onClick={ () => {
                if (suggestionsToGet.length === 0) {

                  // if regular action without extra data needed
                  // set this action as the chosen action
                  changeChoicesBNSAction(state, dispatch, {
                    action: JSON.parse(JSON.stringify(action))
                  })
                  // change page
                  changePageInfoAction(state, dispatch, 5)

                } else {

                  // if special action with extra data needed,
                  // toggle form showing instead based on action info as key
                  if (extraFormData) {
                    const { show } = extraFormData[action.info]
                    setExtraFormData({ ...extraFormData, [action.info]: { show: !show } })
                  }

                }
              }}
            >
              { action.info }{ suggestionsToGet.length > 0 ? (<>&nbsp;...</>) : '' }
            </RoundButton>

            {/* create input forms if shown */}

            { (extraFormData && extraFormData[action.info].show) && (
              suggestionsToGet.map((suggestionToGet: any) => (

                <InputForm
                  key={ suggestionToGet.info.describe }

                  className={ styles.inputForms }

                  thisInputLabel={
                    suggestionToGet.info.describe + (
                      !suggestionToGet.info.get.min ? '' : (
                        '\n' +
                        '(at least ' +
                        getSuggestInfo(suggestionToGet).finalMin + ' ' +
                        getSuggestInfo(suggestionToGet).units + ' to get ' +
                         'a winning valid bid )'.replace(/ /g, '\xa0')
                      )
                    )
                  }

                  thisInputValue={ getSuggestInfo(suggestionToGet).value }

                  thisInputOnChange={ (e: any) => {
                    // sanitize text
                    let cleanText

                    if (suggestionToGet.info.get.min) {
                      cleanText = sanitize(e.target.value, ['no_spaces', 'fractions'])
                    } else {
                      cleanText = sanitize(e.target.value, ['oneline', 'no_spaces'])
                    }

                    console.log('onchange clean text', cleanText)


                    // add changed value to checkActions object
                    // find and edit the value I need to get
                    checkActions
                      .find((thisAction: any) => thisAction.type === action.type )
                      .suggestions
                      .find((thisSuggestion: any) =>
                        thisSuggestion.info.describe === suggestionToGet.info.describe
                      ).info.get.value = cleanText

                    // notify local state about changes with clone
                    setCheckActions([...checkActions])
                  } }

                  thisSubmitButtonOnClick={ () => {

                    // if number do one last update
                    if (suggestionToGet.info.get.min) {
                      const finalize = getSuggestInfo(suggestionToGet).finalValue
                      if (finalize) {
                        const cleanText = finalize()
                        console.log('final clean text', cleanText)
                        checkActions
                        .find((thisAction: any) => thisAction.type === action.type )
                        .suggestions
                        .find((thisSuggestion: any) =>
                          thisSuggestion.info.describe === suggestionToGet.info.describe
                        ).info.get.value = cleanText
                      }
                    }

                    // if input is not blank
                    if (suggestionToGet.info.get.value !== '') {
                      // place the customized action object entirely into the global state
                      changeChoicesBNSAction(state, dispatch, {
                        action: JSON.parse(JSON.stringify(action))
                      })

                      // change page
                      changePageInfoAction(state, dispatch, 5)
                    }

                  } }
                />
              ))
            )}
          </div>
        )
      } else {
        return ''
      }
    })
  )

  // list unavailable actions for render
  const listUnavailableActions = () => (
    !!checkActions && checkActions.map((action: any) => {
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
                if (!permission.isAllowed) {
                  return (
                    <div
                      className={
                        styles.unavailableActions__actionList__action__permissionList__permission
                      }
                      key={ permission.info.describe }
                    >
                      - { permission.info.describe }
                    </div>
                  )
                } else { return '' }
              })}
            </div>
          </div>
        )
      } else {
        return ''
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