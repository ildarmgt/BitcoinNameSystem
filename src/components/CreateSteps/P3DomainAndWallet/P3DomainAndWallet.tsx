import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P3DomainAndWallet.module.css'
import {
  Store,
  unitsBTC,
  satsToBTCSpaced,
  getUnspentSum
} from '../../../store/'
import { changePageInfoAction } from '../../../store/actions'
import { scanAddressFullyAction } from './../../../store/actions'
import { ActionTypes } from './../../../interfaces'

/**
 * Bid on network
 */
export const P3DomainAndWallet = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // Local state: keep track if API is busy
  const [apiStatus, setApiStatus] = React.useState('ok')

  // on state update detected by timestamp, reset api status
  React.useEffect(() => {
    setApiStatus('ok')
  }, [state.lastTimeStamp])

  // most important for domain notificaiton address is the transaction history to know ownership
  // but also the current utxo in case we want to control the domain
  const domainInfo = () => {
    if (state.pageInfo.checkedDomain) {
      return '✓'
    } else {
      return 'needs scan'
    }
  }

  // wallet needs utxo info including raw tx & tx history for nonce
  const walletInfo = () => {
    if (state.pageInfo.checkedWallet) {
      return '✓'
    } else {
      return 'needs scan'
    }
  }

  // Conditions to enable next pages.
  const readyStatus = () => {
    if (!state.pageInfo.checkedDomain && !state.pageInfo.checkedWallet) {
      return { isReady: false, info: 'Scan both to move on' }
    }
    if (!state.pageInfo.checkedDomain && state.pageInfo.checkedWallet) {
      return { isReady: false, info: 'Scan domain to move on' }
    }
    if (state.pageInfo.checkedDomain && !state.pageInfo.checkedWallet) {
      return { isReady: false, info: 'Scan wallet to move on' }
    }
    if (state.pageInfo.checkedDomain && state.pageInfo.checkedWallet) {
      return { isReady: true, info: '' }
    }
    return { isReady: false, info: 'Unknown status' }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        Must scan the domain and owner addresses
      </div>
      <div className={styles.domainInfo}>
        {apiStatus !== 'domain' && 'Domain ' + domainInfo()}
        {apiStatus === 'domain' && 'Domain scanning...'}
      </div>
      <div className={styles.domainButton}>
        <RoundButton
          onClick={() => {
            if (apiStatus === 'ok') {
              setApiStatus('domain')
              scanAddressFullyAction(state, dispatch, ActionTypes.UPDATE_DOMAIN)
            }
          }}
        >
          API Scan
        </RoundButton>
      </div>
      <div className={styles.walletInfo}>
        {apiStatus !== 'wallet' && 'Wallet ' + walletInfo()}
        {apiStatus === 'wallet' && 'Wallet scanning...'}
      </div>
      <div className={styles.walletButton}>
        <RoundButton
          onClick={() => {
            if (apiStatus === 'ok') {
              setApiStatus('wallet')
              scanAddressFullyAction(state, dispatch, ActionTypes.UPDATE_WALLET)
            }
          }}
        >
          API Scan
        </RoundButton>
      </div>
      <div className={styles.unspent}>
        <div className={styles.balance}>
          {state.pageInfo.checkedWallet
            ? satsToBTCSpaced(getUnspentSum(state.wallet.utxoList) / 1e8)
            : 'n/a'}
        </div>
        {' ' + unitsBTC(state)}
      </div>
      <div className={styles.ownership}>{readyStatus().info}</div>
      <div className={styles.buttonWrapper}>
        <RoundButton
          back='true'
          onClick={() => {
            changePageInfoAction(state, dispatch, 2)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          show={readyStatus().isReady ? 'true' : 'false'}
          next='true'
          onClick={() => {
            changePageInfoAction(state, dispatch, 4)
          }}
        >
          Ready
        </RoundButton>
      </div>
    </div>
  )
}
