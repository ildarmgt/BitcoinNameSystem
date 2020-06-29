import React from 'react'
import { Store } from '../../../store/'
import { RoundButton } from '../../general/RoundButton'
import styles from './P6Broadcast.module.css'
import {
  changePageInfoAction,
  addNewApiTaskAction
} from '../../../store/actions'
import { calcTx } from './../../../helpers/bns/'
import { txPushAPI } from './../../../api/blockstream'
import { getUnspentSum } from '../../../helpers/bns/bitcoin'
import { Details } from './../../general/Details'
import { FeesSelection } from './../../wallet/FeesSelection'

/**
 * Broadcast tx page.
 * Fee selection.
 * Transaction summary/status. *
 */
export const P6Broadcast = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // tx calculation
  let tx: any
  let txIssue = ''
  try {
    tx = calcTx(state.wallet, state.domain, state.choices, state.network)
  } catch (e) {
    txIssue = String(e.message)
    if (txIssue.endsWith('has no matching Script')) {
      txIssue += ' \n(address provided seems invalid)'
    }
    console.log('error details if necessary:', e)
  }

  // summarize number of updates in the embeded string
  const numberOfUpdates = state.choices.embedString
    .split(' ')
    .reduce(
      (countSoFar: number, word: string, index: number) =>
        index % 2 === 1 ? countSoFar + 1 : countSoFar,
      0
    )

  // keep track of broadcast
  const [broadcastStatus, setBroadcastStatus] = React.useState({
    ok: false,
    txid: '123',
    reason: ''
  })

  // show BTC balance with styling and proper units based on network
  const unitBTC = state.network === 'testnet' ? ' tBTC ' : ' BTC '
  const showBTC = (sats = 0): JSX.Element => (
    <>
      <span className={styles.balance}>{(sats / 1e8).toFixed(8)}</span>
      {unitBTC}
    </>
  )

  const finalCost = tx
    ? // No point confusing user if the cost is negative.
      // Possible with enough anyone-can-spend utxo found.
      Math.max(tx.gatheredFromWallet - tx.change, 0)
    : undefined

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Finalize transaction details</div>
      <div className={styles.fees}>
        <FeesSelection />
      </div>
      <div className={styles.totalCost}>
        {!!tx ? <>Your final cost: {showBTC(finalCost)}</> : ' '}
      </div>
      <div className={styles.txSummary}>
        {!!tx && (
          <>
            <Details>
              <table>
                <tbody>
                  <tr>
                    <td>Action:</td>
                    <td>{state.choices.action.info}</td>
                  </tr>
                  <tr>
                    <td>Updates:</td>
                    <td>{numberOfUpdates}</td>
                  </tr>
                  <tr>
                    <td>Wallet:</td>
                    <td>
                      <p>
                        {showBTC(getUnspentSum(state.wallet.utxoList))} total
                        across {state.wallet.utxoList.length} utxo
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>Inputs:</td>
                    <td>
                      <p>
                        {showBTC(tx.gatheredFromWallet)} from{' '}
                        {tx.nInputsFromWallet} wallet utxo
                      </p>
                      <p>
                        {showBTC(tx.gatheredFromOther)} from{' '}
                        {tx.nInputsFromOther} notification utxo
                      </p>
                      <p>
                        {showBTC(tx.totalGathered)} total (
                        {tx.nInputsFromWallet + tx.nInputsFromOther} inputs)
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>Outputs:</td>
                    <td>
                      <p>Burning {showBTC(tx.burnAmount)} at #0</p>
                      <p>
                        Sending {showBTC(tx.notifyAmount)} at #1 (notification)
                      </p>
                      <p>Change of {showBTC(tx.change)} sent back at #2</p>
                      <p>Refunds of {showBTC(tx.refundsAmount)} total</p>
                      <p>
                        {showBTC(tx.totalGathered - tx.fee)} total (
                        {tx.nOutputs} outputs)
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>Miner fee:</td>
                    <td>
                      <p>
                        {showBTC(tx.fee)} (
                        {((tx.fee / tx.valueNeeded) * 100.0).toFixed(1)}%)
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>Size:</td>
                    <td>{tx.thisVirtualSize} vBytes</td>
                  </tr>
                  <tr>
                    <td>Cost:</td>
                    <td>
                      <p>+ Transaction requires {showBTC(tx.valueNeeded)}</p>
                      <p>
                        - Using {showBTC(tx.gatheredFromOther)} from
                        anyone-can-spend utxo
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>Net user cost:</td>
                    <td>{showBTC(tx.gatheredFromWallet - tx.change)}</td>
                  </tr>
                </tbody>
              </table>
            </Details>
          </>
        )}
        {!tx && (
          <div className={styles.txSummary}>
            calculation failed <br />
            {txIssue}
          </div>
        )}
      </div>
      <div className={styles.status}>
        {broadcastStatus.ok ? (
          <>
            <div
              className={[styles.status__button, 'canPress'].join(' ')}
              onClick={() => {
                const PATH =
                  `https://blockstream.info/` +
                  `${state.network === 'testnet' ? 'testnet/' : ''}tx/` +
                  `${broadcastStatus.txid}`
                window.open(PATH, '_blank')
              }}
            >
              Success! Open in explorer
            </div>
          </>
        ) : broadcastStatus.reason.length > 0 ? (
          <div className={styles.status__failed}>{broadcastStatus.reason}</div>
        ) : (
          ''
        )}
      </div>
      <div className={styles.buttonWrapper}>
        <RoundButton
          back={'true'}
          onClick={() => {
            changePageInfoAction(state, dispatch, 5)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          show={tx?.hex !== '' ? 'true' : 'false'}
          onClick={async () => {
            if (tx && tx.hex) {
              try {
                const res: any = await addNewApiTaskAction(
                  state,
                  dispatch,
                  () => txPushAPI(tx.hex, state.network, state.api.path)
                )
                setBroadcastStatus({ ok: true, txid: res.txid, reason: '' })
              } catch (e) {
                setBroadcastStatus({ ok: false, txid: '', reason: e.message })
              }
            } else {
              setBroadcastStatus({ ok: false, txid: '', reason: '' })
            }
          }}
        >
          Broadcast
        </RoundButton>
      </div>
    </div>
  )
}
