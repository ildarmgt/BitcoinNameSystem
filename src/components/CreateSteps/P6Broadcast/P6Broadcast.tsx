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
import { Details } from './../../general/Details'

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
  let txIssue: string = ''
  try {
    tx = calcTx(
      state.wallet,
      state.domain,
      state.choices,
      state.network
    )
  } catch (e) {
    txIssue = String(e.message)
    if (txIssue.endsWith('has no matching Script')) {
      txIssue += ' \n(address provided seems invalid)'
      console.log(txIssue)
    }
  }

  // summarize number of updates in the embeded string
  const numberOfUpdates = (state
    .choices
    .embedString
    .split(' ')
    .reduce((countSoFar: number, word: string, index: number, words: Array<string>) =>
      (index % 2 === 1) ? countSoFar + 1 : countSoFar
    , 0)
  )

  // keep track of broadcast
  const [ broadcastStatus, setBroadcastStatus ] = React.useState({
    ok: false,
    txid: '123',
    reason: ''
  })

  // show BTC balance with styling and proper units based on network
  const unitBTC = (state.network === 'testnet') ? ' tBTC ' : ' BTC '
  const showBTC = (sats: number = 0): JSX.Element => (
    <>
      <span className={ styles.balance }>
        { (sats / 1e8).toFixed(8) }
      </span>
      { unitBTC }
    </>
  )

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

  const finalCost = tx ? (
    // No point confusing user if the cost is negative.
    // Possible with enough anyone-can-spend utxo found.
    Math.max(tx.gatheredFromWallet - tx.change, 0)
  ) : undefined

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Finalize transaction details
      </div>
      <div className={ styles.fees }>
        <div className={ styles.fees__rate }>
          <aside>Fee rate (sat / vByte):</aside>
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
                { '< ' }20 min ( { feeSuggestions.min20.toFixed(3) } sat / vByte )
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
                { '< ' }40 min ( { feeSuggestions.min40.toFixed(3) } sat / vByte )
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
                { '< ' }60 min ( { feeSuggestions.min60.toFixed(3) } sat / vByte )
              </div>
            </div>
          ) }
        </div>
      </div>
      <div className={ styles.totalCost }>
        { (!!tx) ? <>Your final cost: { showBTC(finalCost) }</> : ' ' }
      </div>
      <div className={ styles.txSummary }>
        { (!!tx) && (
          <>
            <Details>
              <table><tbody>
                <tr>
                  <td>Action:</td>
                  <td>{ state.choices.action.info }</td>
                </tr>
                <tr>
                  <td>Updates:</td>
                  <td>{ numberOfUpdates }</td>
                </tr>
                <tr>
                  <td>Wallet:</td>
                  <td>
                    <p>{ showBTC(getUnspentSum(state.wallet.utxoList)) } total
                    across { state.wallet.utxoList.length } utxo</p>
                  </td>
                </tr>
                <tr>
                  <td>Inputs:</td>
                  <td>
                    <p>{ showBTC(tx.gatheredFromWallet) } from
                    {' '}{ tx.nInputsFromWallet } wallet utxo</p>
                    <p>{ showBTC(tx.gatheredFromOther) } from
                    {' '}{ tx.nInputsFromOther } notification utxo</p>
                    <p>{ showBTC(tx.totalGathered) } total</p>
                  </td>
                </tr>
                <tr>
                  <td>Outputs:</td>
                  <td>
                    <p>Burning { showBTC(tx.burnAmount) } at #0</p>
                    <p>Sending { showBTC(tx.notifyAmount) } at #1</p>
                    <p>Change of { showBTC(tx.change) } sent back at #2</p>
                    <p>{ tx.nOutputs } total outputs</p>
                  </td>
                </tr>
                <tr>
                  <td>Miner fee:</td>
                  <td>
                    <p>{ showBTC(tx.fee) }{' '}
                    ({(tx.fee / tx.valueNeeded * 100.0).toFixed(1)}%)</p>
                  </td>
                </tr>
                <tr>
                  <td>Size:</td>
                  <td>{ tx.thisVirtualSize } vBytes</td>
                </tr>
                <tr>
                  <td>Cost:</td>
                  <td>
                    <p>+ Transaction requires { showBTC(tx.valueNeeded) }</p>
                    <p>- Using { showBTC(tx.gatheredFromOther) } from anyone-can-spend utxo</p>
                  </td>
                </tr>
                <tr>
                  <td>Net cost:</td>
                  <td>{ showBTC(tx.gatheredFromWallet - tx.change) }</td>
                </tr>
              </tbody></table>
            </Details>
          </>
        )}
        { (!tx) && (
          <div className={ styles.txSummary }>
            calculation failed <br />
            { txIssue }
          </div>
        ) }
      </div>
      <div className={ styles.status }>
        {/* hex here later, only in console now */}
        { (broadcastStatus.ok) ? (
          <>
            <div
              className={ [styles.status__button, 'canPress'].join(' ') }
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
          <div className={ styles.status__failed }>
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