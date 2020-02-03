import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P3DomainAndWallet.module.css'
import { Store } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'
import { scanAddressFullyAction } from './../../../store/actions'
import { ActionTypes } from './../../../interfaces'
import { getUnspentSum } from './../../../helpers/bitcoin'

/**
 * Bid on network
 */
export const P3DomainAndWallet = () => {
  const { state, dispatch } = React.useContext(Store) // global state

  // Local state: keep track if API is busy
  const [ apiStatus, setApiStatus ] = React.useState('ok')

  // on state update detected by timestamp, reset api status
  React.useEffect(() => { setApiStatus('ok') }, [ state.lastTimeStamp ])

  // most important for domain notificaiton address is the transaction history to know ownership
  // but also the current utxo in case we want to control the domain
  const domainInfo = () => {
    if (state.domain.checkedHistory && state.domain.checkedUtxo) {
      return ('✓')
    } else {
      return ('needs scan')
    }
  }

  // wallet needs utxo info including raw tx & tx history for nonce
  const walletInfo = () => {
    if (state.wallet.checkedHistory && state.wallet.checkedUtxo) {
      return ( '✓' )
    } else {
      return ('needs scan')
    }
  }

  // are all necessary scans done
  const areScansDone = () => {
    return (
      state.wallet.checkedUtxo &&
      state.wallet.checkedHistory &&
      state.domain.checkedUtxo &&
      state.domain.checkedHistory
    )
  }

  // Conditions to enable next pages.
  // if owner - full control
  // if domain available - bid
  // if not owner, warn user
  // (TODO) if auction period, challenge bids
  const readyStatus = () => {
    if (!areScansDone()) {
      // needs scans
      return { isReady: false,  type: 'missing', info: 'Scan both to move on' }
    }
    const ownerAddress = state.domain.currentOwner;
    const walletAddress = state.wallet.address;
    const isWalletAddress = (walletAddress !== '')
    const isDomainAvailable = (ownerAddress === '')
    const isWalletTheOwner = (walletAddress === ownerAddress)
    if (!isWalletAddress) {
      return { isReady: false,  type: 'nowallet', info: 'No wallet loaded' }
    }
    if (isWalletTheOwner && !isDomainAvailable) {
      return { isReady: true,   type: 'owner',    info: 'Your domain ready' }
    }
    if (!isWalletTheOwner && isDomainAvailable) {
      return { isReady: true,   type: 'open',     info: 'Domain is available' }
    }
    if (!isWalletTheOwner && !isDomainAvailable) {
      return { isReady: false,  type: 'taken',    info: 'Not your domain' }
    }
    console.log('Unknown status of ownership', ownerAddress, walletAddress, isWalletAddress, isDomainAvailable, isWalletTheOwner)
    return { isReady: false,    type: 'unknown',  info: '' }
  }

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Wallet and domain history needed. <br />
        (No offline method yet)
      </div>
      <div className={ styles.domainInfo }>
        { (apiStatus !== 'domain')  && 'Domain ' + domainInfo() }
        { (apiStatus === 'domain')  && 'Domain scanning...' }
      </div>
      <div className={ styles.domainButton }>
        <RoundButton
          onClick={ () => {
            if (apiStatus === 'ok') {
              setApiStatus('domain')
              scanAddressFullyAction(state, dispatch, ActionTypes.UPDATE_DOMAIN)
            }
          }}
        >
          API Scan
        </RoundButton>
      </div>
      <div className={ styles.walletInfo }>
        { (apiStatus !== 'wallet')  && 'Wallet ' + walletInfo() }
        { (apiStatus === 'wallet') && 'Wallet scanning...' }
      </div>
      <div className={ styles.walletButton }>
        <RoundButton
          onClick={ () => {
            if (apiStatus === 'ok') {
              setApiStatus('wallet')
              scanAddressFullyAction(state, dispatch, ActionTypes.UPDATE_WALLET)
            }
          }}
        >
          API Scan
        </RoundButton>
      </div>
      <div className={ styles.unspent }>
        <div className={ styles.balance }>
          { state.wallet.checkedUtxo? (getUnspentSum(state.wallet.utxoList) / 1e8).toFixed(8) : 'n/a' }
        </div>
        { (state.network === 'testnet') ? ' tBTC' : ' BTC' }
      </div>
      <div className={ styles.ownership }>
        { readyStatus().info }
      </div>
      <div className={ styles.buttonWrapper }>
        <RoundButton
          back='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 2)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          show={ readyStatus().isReady ? 'true' : 'false' }
          next='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 4)
          }}
        >
          Ready
        </RoundButton>
      </div>
    </div>
  )
}

