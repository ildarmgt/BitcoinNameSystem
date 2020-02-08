import React from 'react'
import { Store } from '../../../store'
import { RoundButton } from '../../general/RoundButton'
import styles from './P6Broadcast.module.css'
import { changePageInfoAction } from '../../../store/actions'
import { calcTx } from './../../../helpers/bns/'
import { txPush } from './../../../api/blockstream'

/**
 * Broadcast tx page.
 * Fee selection.
 * Transaction summary/status. *
 */
export const P6Broadcast = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  const tx = calcTx(
    state.wallet,
    state.domain,
    state.choices,
    state.network
  )

  const numberOfUpdates = (state
    .choices
    .embedString
    .split(' ')
    .reduce((countSoFar: number, word: string, index: number, words: Array<string>) =>
      (index % 2 === 1) ? countSoFar + 1 : countSoFar
    , 0)
  )

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Transaction results:
      </div>
      <div className={ styles.feeAPI }>
        <RoundButton>
          Suggest Fees (API)
        </RoundButton>
      </div>
      <div className={ styles.feeSelection }>
        Fee estimate: [10] [20] [60] minutes
      </div>
      <div className={ styles.Rate }>
        { state.choices.feeRate }
      </div>
      <div className={ styles.txSummary }>
        Action: { state.choices.action.info }<br />
        Updates and commands: { numberOfUpdates }<br />
        Fee:
        { (tx.fee / 1e8).toFixed(8) }
        ({(tx.fee / tx.valueNeeded * 100.0).toFixed(1)}%)
        <br />
        Spending:
        { (tx.totalGathered / 1e8).toFixed(8) } BTC
        ({ tx.nInputs  }{ tx.nInputs === 1 ? ' input' : ' inputs' })
        <br />
        Change: { (tx.change / 1e8).toFixed(8) } BTC<br />
        Total cost: { (tx.valueNeeded / 1e8).toFixed(8) } BTC<br />



      </div>
      <div className={ styles.txHex }>
        Transaction { tx ? ' calculated successfully!' : 'calculation failed' }
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
          onClick={ () => {
            console.log('tx hex', state.choices.txHex)
            txPush(tx.hex, state.network)
          } }
        >
          Broadcast
        </RoundButton>
      </div>

    </div>
  )
}