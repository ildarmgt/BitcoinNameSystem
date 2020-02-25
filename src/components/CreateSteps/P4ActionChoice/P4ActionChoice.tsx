import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ActionChoice.module.css'
import { Store } from '../../../store/'
import { changePageInfoAction, changeChoicesBNSAction } from '../../../store/actions'
import { Details } from './../../general/Details'
import { runAllActionPermissionChecks, calcBnsState, getGetters, getSetters } from './../../../helpers/bns/'
import { I_Checked_Action } from './../../../helpers/bns/types'
import { InputForm } from './../../general/InputForm'
import { Switch } from './../../general/Switch'
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
    setCheckActions(runAllActionPermissionChecks(bns, state.wallet.address) as Array<I_Checked_Action>)
  }

  // help with understanding a get suggestion
  const getSuggestInfo = (getSuggestion: any) => {
    const get = getSuggestion.info.get
    const network = state.network
    const units = get.units
    const min = get.min
    const type = typeof get.value


    if (type === 'number') {

      // if satoshi, convert to btc
      const btcMin = min ? (units === 'satoshi' ? (min / 1.0e8) : min) : 0
      const btcUnits = network === 'testnet' ? 'tBTC' : 'BTC'
      const btcValue = units === 'satoshi' ? (get.value / 1.0e8) : get.value


      return {
        value: get.value,                           // raw value
        btcMin: '' + btcMin,                        // min in BTC
        btcMinFull: btcMin.toFixed(8),              // ^ with 8 decimal places
        type,                                       // typeof on min
        units,                                      // original units
        btcUnits,                                   // btc units tBTC or BTC
        btcValue,                                   // btc value
        btcValueFull: btcValue.toFixed(8)           // btc value with 8 decimal places
      }
    }

    // if a string
    return {
      type,
      value: get.value
    }
  }

  // render suggestion data
  const renderSetSuggestion = (setSuggestion: any, settings: any) => {
    const set = setSuggestion.info.set
    const value = setSuggestion.info.set.value

    let valueToReturn = ['']
    const valueArray = String(value).split(/ |\n/)
    const unitsArray = set.units.split(' ')

    for (let i = 0; i < valueArray.length; i++) {
      const thisValue = valueArray[i]
      const units = unitsArray[i % unitsArray.length]

      // if this is not the first set of values, add next line char
      if (i % unitsArray.length === 0 && i !== 0) {
        valueToReturn = [...valueToReturn, '\n']
      }

      if (i % unitsArray.length === 0) {
        if (settings.bullets) {
          valueToReturn = [...valueToReturn, ' + ']
        }
      }


      if (!isNaN(Number(thisValue))) {
        // if value can be a number

        // assume it's in bitcoin form already unless units are satoshi

        // show btc value to 8 decimal spaces
        if (settings.btcValueFull) {
          if (units === 'satoshi') {
            valueToReturn = [...valueToReturn, (parseInt(thisValue, 10) / 1.0e8).toFixed(8)]
          } else {
            valueToReturn = [...valueToReturn, parseFloat(thisValue).toFixed(8)]
          }
        }

        // show correct btc units
        if (settings.btcUnits) {
          valueToReturn = [...valueToReturn, state.network === 'testnet' ? ' tBTC' : ' BTC']
        }

      } else {
        // if not a number

        // if function for strings was provided
        if (settings.strings) {
          valueToReturn = [...valueToReturn, ' ', ...settings.strings(thisValue), ' ']
        }
      }
    }

    return (
      <>
        { valueToReturn }
      </>
    )
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

        console.log('action:', action.info)
        console.log('getters:', getGetters(action))
        console.log('setters:', getSetters(action))

        const haveGettersOrSetters = (
          suggestionsToGet.length > 0 || getSetters(action).length > 0
        )

        return (

          // action div start
          <div key={ action.info }>
            {/* change what action button does based on if there's data to get */}
            {/* missing data (~ get suggestion) means it has to be requested first before moving on */}
            <RoundButton
              next={ !haveGettersOrSetters ? 'true' : undefined }
              onClick={ () => {
                if (!haveGettersOrSetters) {

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
              { action.info }{
                (haveGettersOrSetters)
                  ? (<>&nbsp;...</>)
                  : ''
              }
            </RoundButton>

            {/* create input forms if shown */}

            { (extraFormData && extraFormData[action.info].show) && (
              <>
                { suggestionsToGet.map((suggestionToGet: any) => {
                  if (typeof suggestionToGet.info.get.value === 'boolean') {

                    const onChangeFunction = (value: boolean) => {
                      console.log(value)
                      // find and change action setting
                      checkActions
                        .find((thisAction: any) => thisAction.type === action.type )
                        .suggestions
                        .find((thisSuggestion: any) =>
                          thisSuggestion.info.describe === suggestionToGet.info.describe
                        ).info.get.value = value
                      // update local state with edited object
                      setCheckActions([...checkActions])
                    }

                    return <Switch
                      key={ suggestionToGet.info.describe }

                      thisInputLabel={
                        suggestionToGet.info.describe + ': \n  ' +
                        suggestionToGet.info.get.name
                      }

                      initialIndex={
                        suggestionToGet.info.get.value ? 1 : 0
                      }

                      choices={[
                        { value: false,   display: 'No',    do: onChangeFunction },
                        { value: true,    display: 'Yes',   do: onChangeFunction }
                      ]}
                    />

                  } else {

                    return <InputForm
                      key={ suggestionToGet.info.describe }

                      showButton={ 'false' }

                      className={ styles.inputForms }

                      thisInputLabel={
                        // show minimum if available in bitcoin units
                        suggestionToGet.info.describe + (
                          !suggestionToGet.info.get.min ? '' : (
                            // if has a min
                            '\n' +
                            '(at least ' +
                            getSuggestInfo(suggestionToGet).btcMinFull + ' ' +
                            getSuggestInfo(suggestionToGet).btcUnits + ' to get a winning ' +
                            'valid bid )'.replace(/ /g, '\xa0')
                          )
                        )
                      }

                      thisInitialValue={
                        // if number, show in BTC and to 8 digits intially
                        (typeof suggestionToGet.info.get.value === 'number')
                          ? getSuggestInfo(suggestionToGet).btcValueFull
                          // if not number just show the actual value
                          : suggestionToGet.info.get.value
                      }

                      sanitizeFilters={ [typeof suggestionToGet.info.get.value] }

                      thisInputOnChange={ (e: any) => {
                        // type in bitcoin units
                        // store into memory in expected units (depending on .units)

                        // sanitize text
                        let cleanInput: number | string

                        if (
                          typeof suggestionToGet.info.get.min === 'number' ||
                          typeof suggestionToGet.info.get.value === 'number'
                        ) {
                          // if number
                          cleanInput = sanitize(e.target.value, ['no_spaces', 'fractions', 'no_leading_zeros', 'decimal_point'])

                          if (suggestionToGet.info.get.units === 'satoshi') {
                            // convert to satoshi and then number
                            cleanInput = Math.round(parseFloat(cleanInput) * 1.0e8)
                          } else {
                            // just convert to number
                            cleanInput = Math.round(parseFloat(cleanInput))
                          }

                        } else {
                          // if string, just make sure no spaces
                          cleanInput = sanitize(e.target.value, ['no_spaces'])
                        }

                        // add changed value to checkActions current object
                        // find and edit the value
                        checkActions
                          .find((thisAction: any) => thisAction.type === action.type )
                          .suggestions
                          .find((thisSuggestion: any) =>
                            thisSuggestion.info.describe === suggestionToGet.info.describe
                          ).info.get.value = cleanInput

                        // update local state with edited object
                        setCheckActions([...checkActions])
                      } }
                    />
                  }
                }) }
                { (getSetters(action).length > 0) &&
                  <Details description={ 'Details...' } show={ 'false' }>
                    <p>
                      { getSetters(action).map((setSuggestion: any, index: number) => {

                        const setDescription = setSuggestion.info.describe || ''
                        const setName = setSuggestion.info.set.name || ''

                        return (
                          <span key={ setDescription }>
                            { index + 1 }. { setDescription }: { '\n' }

                            { renderSetSuggestion(setSuggestion, {
                                btcValueFull: true,
                                btcUnits: true,
                                bullets: true,
                                strings: (content: string) => ([
                                  'for ',
                                  <span
                                    key={ setDescription + content }
                                    className={ styles.breakable }
                                  >
                                    { content }
                                  </span>
                                ])
                            }) }

                            { ' ' + ('(' + setName + ')').replace(/ /g, '\xa0') }
                          </span>
                        )

                      } ) }
                    </p>
                  </Details>
                }
              </>
            )}

            { (extraFormData && extraFormData[action.info].show) && (
              <RoundButton
                className={ styles.okButton }
                next={ 'true' }
                onClick={ () => {


                  // place the customized action object entirely into the global state
                  changeChoicesBNSAction(state, dispatch, {
                    action: action // JSON.parse(JSON.stringify( needed?
                  })

                  // change page
                  changePageInfoAction(state, dispatch, 5)

                  // const isNotEmpty = suggestionToGet.info.get.value !== ''
                  // const meetsMinRequirement = (typeof suggestionToGet.info.get.min === 'number')
                  //     ? (suggestionToGet.info.get.value >= suggestionToGet.info.get.min)
                  //     : true

                  // // if input is not blank
                  // if (isNotEmpty && meetsMinRequirement) {}

                } }
              >
                OK
              </RoundButton>
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
        Available <span className={ styles.orange }>BNS</span> <br />actions
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