import React from 'react'
import { Store } from './../../../store/'
import styles from './Withdraw.module.css'
import { RoundButton } from './../../general/RoundButton'
import { ActionTypes } from './../../../interfaces'
import {
  scanAddressFullyAction,
  changePageInfoAction
} from './../../../store/actions'
import { useHistory } from 'react-router-dom'
import { getUnspentSum } from '../../../helpers/bns/bitcoin'
import { FeesSelection } from './../FeesSelection'
import { Logo } from './../../general/Logo'

/**
 * Allow withdrawals
 */
export const Withdraw = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)


  // Local state: keep track if API is busy
  const [ apiStatus, setApiStatus ] = React.useState('ok')

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

  const history = useHistory()

  // if wallet is not loaded, send to create page 1
  if (!state.wallet.mnemonic) {
    changePageInfoAction(state, dispatch, 1)
    history.push('/create')
  }

  return (
    <div className={ styles.wrapper }>

      <Logo
        className={ styles.logo }
      />

      <div className={ styles.title }>
        Withdraw from wallet
      </div>

      <div className={ styles.request }>
        { !state.pageInfo.checkedWallet && (
          <>
            <RoundButton
              onClick={ () => {
                if (apiStatus === 'ok') {
                  setApiStatus('wallet')
                  scanAddressFullyAction(state, dispatch, ActionTypes.UPDATE_WALLET)
                }
              }}
            >
              Scan wallet
            </RoundButton>
          </>
        ) }
      </div>

      { state.pageInfo.checkedWallet && (
        <div className={ styles.fees }>
          <FeesSelection />
        </div>
      ) }

      { state.pageInfo.checkedWallet && (
        <div className={ styles.total }>
          { showBTC(
            getUnspentSum(state.wallet.utxoList)
          ) }
        </div>
      ) }
      <div>
        to address
      </div>
      <div>
        to amount
      </div>
      <div>
        returned amount
      </div>
      <div>
        broadcast button
      </div>
    </div>
  )
}
