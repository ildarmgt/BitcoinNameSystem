import React from 'react'
import {
  Store,
  unitsBTC,
  satsToBTCSpaced,
  getUnspentSum
} from '../../../store/'
import styles from './Withdraw.module.css'
import { RoundButton } from './../../general/RoundButton'
import { ActionTypes } from './../../../interfaces'
import {
  scanAddressFullyAction,
  changePageInfoAction
} from './../../../store/actions'
import { useHistory } from 'react-router-dom'
import { FeesSelection } from './../FeesSelection'
import { InputForm } from './../../general/InputForm'

/**
 * Allow withdrawals
 */
export const Withdraw = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // keep track if button already clicked
  const [btnAvailable, setBtnAvailable] = React.useState(true)

  // format btc values and units for render
  const showBTC = (sats = 0): JSX.Element => (
    <>
      <span className={styles.balance}>{satsToBTCSpaced(sats)}</span>
      {' ' + unitsBTC(state) + ' '}
    </>
  )

  // if wallet is not loaded, send to create page 1 to load wallet
  const history = useHistory()
  if (!state.wallet.mnemonic) {
    changePageInfoAction(state, dispatch, 1)
    history.push('/create')
  }

  const scanWalletButton = () => (
    <RoundButton
      onClick={async () => {
        if (btnAvailable) {
          setBtnAvailable(false)
          await scanAddressFullyAction(
            state,
            dispatch,
            ActionTypes.UPDATE_WALLET
          )
          setBtnAvailable(true)
        }
      }}
    >
      {!btnAvailable && 'Scanning wallet'}
      {btnAvailable && state.pageInfo.checkedWallet && 'Re-scan wallet...'}
      {btnAvailable && !state.pageInfo.checkedWallet && 'Scan wallet...'}
    </RoundButton>
  )

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.wrapper}>
      (NOT DONE)
      {/* page title */}
      <div className={styles.title}>Withdraw from control address</div>
      {/* scan wallet button */}
      <div className={styles.request}>{scanWalletButton()}</div>
      {state.pageInfo.checkedWallet && (
        <>
          {/* if wallet scanned, show fee selection */}
          <div className={styles.fees}>
            <FeesSelection />
          </div>

          {/* show control address balance */}
          <div className={styles.total}>
            Control address: {showBTC(getUnspentSum(state.wallet.utxoList))}
          </div>

          {/* to address */}
          <InputForm />

          {/* to amount */}
          <InputForm />

          {/* change */}

          {/* calc & broadcast button */}
          <RoundButton>Send</RoundButton>
        </>
      )}
      {/* <div>to address</div>
      <div>to amount</div>
      <div>returned amount</div>
      <div>broadcast button</div> */}
    </div>
  )
}
