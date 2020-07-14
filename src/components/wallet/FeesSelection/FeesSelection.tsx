import React from 'react'
import styles from './FeesSelection.module.css'
import { Store } from '../../../store/'
import { RoundButton } from './../../general/RoundButton'
import sanitize from './../../../helpers/sanitize'
import {
  addNewApiTaskAction,
  changeChoicesBNSAction
} from './../../../store/actions'

import { getFeeEstimatesAPI } from './../../../api/blockstream'

/**
 * Fees selection dialogue.
 * Modifies global state.choices.feeRate.
 */
export const FeesSelection = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // local states to track fees and suggestions
  const [feeText, setFeeText] = React.useState(state.choices.feeRate)
  const [feeSuggestions, setFeeSuggestions] = React.useState({
    showSuggestions: false,
    apiSuccess: false,
    min20: 1,
    min40: 1,
    min60: 1
  })

  // get new suggestions if never got them through api
  // otherwise show previous
  const tryFees = async () => {
    // if haven't already got api results
    if (!feeSuggestions.apiSuccess) {
      try {
        // get fee estimates from API
        const apiSuggest: any = await addNewApiTaskAction(state, dispatch, () =>
          getFeeEstimatesAPI(state.network, state.api.path)
        )
        setFeeSuggestions({
          min20: apiSuggest['2'],
          min40: apiSuggest['4'],
          min60: apiSuggest['6'],
          apiSuccess: true,
          showSuggestions: true
        })
      } catch (e) {}
    } else {
      // show the previous values
      setFeeSuggestions({
        ...feeSuggestions,
        showSuggestions: !feeSuggestions.showSuggestions
      })
    }
  }

  return (
    <div className={styles.fees}>
      <div className={styles.fees__rate}>
        <aside>Fee rate (sat / vByte):</aside>
        <textarea
          spellCheck={false}
          value={feeText}
          placeholder={'e.g. 1.2'}
          onChange={e => {
            const cleanText = sanitize(e.target.value, [
              'numbers',
              'decimal_point',
              'no_leading_zeros'
            ])
            setFeeText(cleanText)
            // 123. works in parseFloat and outputs 123 so safe
            const cleanNumber = parseFloat(cleanText)
            changeChoicesBNSAction(state, dispatch, { feeRate: cleanNumber })
          }}
        ></textarea>
      </div>
      <div className={styles.fees__apicall}>
        <RoundButton
          onClick={() => {
            tryFees()
          }}
          minor={'true'}
        >
          Suggest
        </RoundButton>
        {feeSuggestions.showSuggestions && (
          <div className={styles.fees__feeSelection}>
            <div
              className={styles.fees__feeSelection__choice}
              onClick={() => {
                setFeeText(feeSuggestions.min20)
                changeChoicesBNSAction(state, dispatch, {
                  feeRate: feeSuggestions.min20
                })
                setFeeSuggestions({ ...feeSuggestions, showSuggestions: false })
              }}
            >
              {'< '}20 min ( {feeSuggestions.min20.toFixed(1)} sat / vByte )
            </div>
            <div
              className={styles.fees__feeSelection__choice}
              onClick={() => {
                setFeeText(feeSuggestions.min40)
                changeChoicesBNSAction(state, dispatch, {
                  feeRate: feeSuggestions.min40
                })
                setFeeSuggestions({ ...feeSuggestions, showSuggestions: false })
              }}
            >
              {'< '}40 min ( {feeSuggestions.min40.toFixed(1)} sat / vByte )
            </div>
            <div
              className={styles.fees__feeSelection__choice}
              onClick={() => {
                setFeeText(feeSuggestions.min60)
                changeChoicesBNSAction(state, dispatch, {
                  feeRate: feeSuggestions.min60
                })
                setFeeSuggestions({ ...feeSuggestions, showSuggestions: false })
              }}
            >
              {'< '}60 min ( {feeSuggestions.min60.toFixed(1)} sat / vByte )
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
