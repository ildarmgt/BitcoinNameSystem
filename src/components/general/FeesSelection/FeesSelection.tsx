import React from 'react'
import styles from './FeesSelection.module.css'
import { RoundButton } from './../../general/RoundButton'
import sanitize from './../../../helpers/sanitize'
// import {
//   addNewApiTaskAction,
//   changeChoicesBNSAction
// } from './../../../store/actions'
// import { getFeeEstimatesAPI } from './../../../api/blockstream'

/**
 * Fees selection dialogue.
 * Modifies fees
 * .initialFee = set initial fee
 * .getFeeSuggestions = function that returns fee suggestions
 * .setFee = function that sets fees *
 */
export const FeesSelection = (props: any) => {
  // get necessary items from props
  const initialFee = props.initialFee
  // e.g. state.choices.feeRate
  const setFeeExternal = props.setFee
  // e.g. changeChoicesBNSAction(state, dispatch, { feeRate: cleanNumber })
  const getFeeSuggestionsExternal = props.getFeeSuggestions
  //  e.g. await addNewApiTaskAction(state, dispatch, () =>
  //    getFeeEstimatesAPI(state.network, state.api.path)
  //  )

  // local states to track fees and suggestions
  const [feeText, setFeeText] = React.useState(initialFee)
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
        // get fee estimates from provided function (e.g. API)
        const apiSuggest: any = await getFeeSuggestionsExternal()
        // remember fee estimates
        setFeeSuggestions({
          min20: apiSuggest['2'],
          min40: apiSuggest['4'],
          min60: apiSuggest['6'],
          apiSuccess: true,
          showSuggestions: true
        })
      } catch (e) {}
    } else {
      // if already know suggestions, show the previous values
      setFeeSuggestions({
        ...feeSuggestions,
        showSuggestions: !feeSuggestions.showSuggestions
      })
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

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
            setFeeExternal(cleanNumber)
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
                // set fee rate shown
                setFeeText(feeSuggestions.min20)
                // export fee
                setFeeExternal(feeSuggestions.min20)
                // hide fee window
                setFeeSuggestions({ ...feeSuggestions, showSuggestions: false })
              }}
            >
              {'< '}20 min ( {feeSuggestions.min20.toFixed(1)} sat / vByte )
            </div>
            <div
              className={styles.fees__feeSelection__choice}
              onClick={() => {
                setFeeText(feeSuggestions.min40)
                setFeeExternal(feeSuggestions.min40)
                setFeeSuggestions({ ...feeSuggestions, showSuggestions: false })
              }}
            >
              {'< '}40 min ( {feeSuggestions.min40.toFixed(1)} sat / vByte )
            </div>
            <div
              className={styles.fees__feeSelection__choice}
              onClick={() => {
                setFeeText(feeSuggestions.min60)
                setFeeExternal(feeSuggestions.min60)
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
