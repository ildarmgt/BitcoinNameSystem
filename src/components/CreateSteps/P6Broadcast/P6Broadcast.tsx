import React from 'react'
import { Store } from '../../../store'
import { RoundButton } from '../../general/RoundButton'
import styles from './P6Broadcast.module.css'
import { changeChoicesBNSAction, changePageInfoAction } from '../../../store/actions'
import { calcTx } from './../../../helpers/bns/'
import { txPush } from './../../../api/blockstream'
import sanitize from './../../../helpers/sanitize'
import { getFeeEstimates } from './../../../api/blockstream'
import { getUnspentSum } from '../../../helpers/bns/bitcoin'

/**
 * Broadcast tx page.
 * Fee selection.
 * Transaction summary/status. *
 */
export const P6Broadcast = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // local state for fee rate text that can end on decimal
  const [ feeText, setFeeText ] = React.useState(state.choices.feeRate)
  const [ feeSuggestions, setFeeSuggestions ] = React.useState({
    showSuggestions: false,
    apiSuccess: false,
    min20: 1,
    min40: 1,
    min60: 1,
  })

  // tx calculation
  let tx: any;
  try {
    tx = calcTx(
      state.wallet,
      state.domain,
      state.choices,
      state.network
    )
  } catch (e) { console.log('tx calc failed:', e) }

  // summarize number of updates in the embeded string
  const numberOfUpdates = (state
    .choices
    .embedString
    .split(' ')
    .reduce((countSoFar: number, word: string, index: number, words: Array<string>) =>
      (index % 2 === 1) ? countSoFar + 1 : countSoFar
    , 0)
  )

  const [ broadcastStatus, setBroadcastStatus ] = React.useState({
    ok: false,
    txid: '123',
    reason: ''
  })

  // get new suggestions if never got them through api
  // otherwise show previous
  const tryFees = async () => {
    if (!feeSuggestions.apiSuccess) {
      try {
        const apiSuggest = await getFeeEstimates(state.network)
        setFeeSuggestions({
          min20: apiSuggest['2'],
          min40: apiSuggest['4'],
          min60: apiSuggest['6'],
          apiSuccess: true,
          showSuggestions: true
        })

      } catch (e) {}
    } else {
      setFeeSuggestions({
        ...feeSuggestions,
        showSuggestions: true
      })
    }
  }

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Finalize transaction details
      </div>
      <div className={ styles.fees }>
        <div className={ styles.fees__rate }>
          <aside>Fee rate (sat/vByte):</aside>
          <textarea
            spellCheck={ false }
            value={ feeText }
            placeholder={ 'e.g. 1.2' }
            onChange={ (e) => {
              const cleanText = sanitize(e.target.value, [
                'numbers', 'decimal_point', 'no_leading_zeros'
              ])
              setFeeText(cleanText)
              // 123. works in parseFloat and outputs 123 so safe
              const cleanNumber = parseFloat(cleanText)
              changeChoicesBNSAction(state, dispatch, { feeRate: cleanNumber })
            } }
          ></textarea>
        </div>
        <div className= { styles.fees__apicall }>
          <RoundButton
            onClick={ () => {
              tryFees()
            } }
          >
            Check online
          </RoundButton>
        </div>
          { (feeSuggestions.showSuggestions) && (
            <div className={ styles.fees__feeSelection }>
              <div
                className= { styles.fees__feeSelection__choice }
                onClick={ () => {
                  setFeeText(feeSuggestions.min20)
                  changeChoicesBNSAction(state, dispatch, {
                    feeRate: feeSuggestions.min20
                  })
                  setFeeSuggestions({...feeSuggestions, showSuggestions: false})
                } }
              >
                { '<' }20 min ({ feeSuggestions.min20 } sat/vByte)
              </div>
              <div
                className= { styles.fees__feeSelection__choice }
                onClick={ () => {
                  setFeeText(feeSuggestions.min40)
                  changeChoicesBNSAction(state, dispatch, {
                    feeRate: feeSuggestions.min40
                  })
                  setFeeSuggestions({...feeSuggestions, showSuggestions: false})
                } }
              >
                { '<' }40 min ({ feeSuggestions.min40 } sat/vByte)
              </div>
              <div
                className= { styles.fees__feeSelection__choice }
                onClick={ () => {
                  setFeeText(feeSuggestions.min60)
                  changeChoicesBNSAction(state, dispatch, {
                    feeRate: feeSuggestions.min60
                  })
                  setFeeSuggestions({...feeSuggestions, showSuggestions: false})
                } }
              >
                { '<' }60 min ({ feeSuggestions.min60 } sat/vByte)
              </div>
            </div>
          ) }
      </div>

      <div className={ styles.txSummary }>
        { (!!tx) && (
          <table><tbody>
            <tr>
              <th>Action:</th>
              <th>{ state.choices.action.info }</th>
            </tr>
            <tr>
              <th>Updates:</th>
              <th>{ numberOfUpdates }</th>
            </tr>
            <tr>
              <th>Inputs:</th>
              <th>{ tx.nInputs }</th>
            </tr>
            <tr>
              <th>Outputs:</th>
              <th>{ tx.nOutputs }</th>
            </tr>
            <tr>
              <th>Size:</th>
              <th>{ tx.thisVirtualSize } vBytes</th>
            </tr>
            <tr>
              <th>Available:</th>
              <th>{ (getUnspentSum(state.wallet.utxoList) / 1e8).toFixed(8) } BTC</th>
            </tr>
            <tr>
              <th>Burning:</th>
              <th>
                { (tx.burnAmount / 1e8).toFixed(8) } BTC
              </th>
            </tr>
            <tr>
              <th>Miner fee:</th>
              <th>
                { (tx.fee / 1e8).toFixed(8) } BTC
                {' '}
                ({(tx.fee / tx.valueNeeded * 100.0).toFixed(1)}%)
              </th>
            </tr>
            <tr>
              <th>Total cost:</th>
              <th>{ (tx.valueNeeded / 1e8).toFixed(8) } BTC</th>
            </tr>
          </tbody></table>
        )}
        { (!tx) && (
          <div className={ styles.txSummary }>
            calculation failed
          </div>
        ) }
      </div>
      <div className={ styles.txid }>
        {/* hex here later, only in console now */}
        { (broadcastStatus.ok) ? (
          <>
            <div
              className={ [styles.txid__button, 'canPress'].join(' ') }
              onClick={ () => {
                const PATH = `https://blockstream.info/` +
                `${ state.network === 'testnet' ? 'testnet/' : '' }tx/` +
                `${ broadcastStatus.txid }`
                window.open(PATH, '_blank')
              } }
            >
              Success! Open in explorer
            </div>
          </>
        ) : (broadcastStatus.reason.length > 0) ? (
          <div className={ styles.txid__failed }>
            { broadcastStatus.reason }
          </div>
        ) : ''
      }
      </div>
      <div className={ styles.buttonWrapper }>
        <RoundButton
          back={ 'true' }
          onClick={ () => { changePageInfoAction(state, dispatch, 5) } }
        >
          Back
        </RoundButton>
        <RoundButton
          show={ tx?.hex !== '' ? 'true' : 'false' }
          onClick={ async () => {
            try {
              const res = await txPush(tx.hex, state.network)
              setBroadcastStatus({ok: true, txid: res.txid, reason: '' })
            } catch (e) {
              setBroadcastStatus({ok: false, txid: '', reason: e.message })
            }
          } }
        >
          Broadcast
        </RoundButton>
      </div>

    </div>
  )
}