import React from 'react'
import {
  Store,
  unitsBTC,
  satsToBTCSpaced,
  getUnspentSum
  // getNetworkName
} from '../../../store/'
import styles from './Withdraw.module.css'
import { RoundButton } from './../../general/RoundButton'
import { ActionTypes } from './../../../interfaces'
import {
  scanAddressFullyAction,
  changePageInfoAction
} from './../../../store/actions'
import { useHistory } from 'react-router-dom'
// import { FeesSelection } from './../FeesSelection'
import { InputForm } from './../../general/InputForm'

/**
 * Allow withdrawals.
 */
export const Withdraw = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)
  // keep track if button already clicked
  const [btnAvailable, setBtnAvailable] = React.useState(true)
  // first load
  const [initialized, setInitialized] = React.useState(false)

  // address to send to, local state
  const [withdrawAddress, setWithdrawAddress] = React.useState('')

  const controlBalance = getUnspentSum(state.wallet.utxoList)

  // format btc values and units for render
  const showBTC = (sats = 0): JSX.Element => (
    <div className={styles.total}>
      <span className={styles.total__value}>{satsToBTCSpaced(sats)}</span>
      <span className={styles.total__units}>{' ' + unitsBTC(state) + ' '}</span>
    </div>
  )

  // if wallet is not loaded, send to create page 1 to load wallet
  const history = useHistory()
  if (!state.wallet.mnemonic) {
    changePageInfoAction(state, dispatch, 1)
    history.push('/create')
  }

  // scan the wallet
  const scanWallet = async () => {
    if (btnAvailable) {
      // wrap in try so if page switches too fast so button can't be set, no issue
      try {
        setBtnAvailable(false)
        await scanAddressFullyAction(state, dispatch, ActionTypes.UPDATE_WALLET)
        setBtnAvailable(true)
      } catch (e) {}
    }
  }

  const scanWalletButton = () => (
    <RoundButton
      className={styles.btnScan}
      onClick={async () => {
        scanWallet()
      }}
      minor={'true'}
    >
      {!btnAvailable && 'scanning...'}
      {btnAvailable && state.pageInfo.checkedWallet && 're-scan'}
      {btnAvailable && !state.pageInfo.checkedWallet && 'scan'}
    </RoundButton>
  )

  // run scan on load if wallet hasn't been scanned
  if (!initialized && !state.pageInfo.checkedWallet) {
    setInitialized(true)
    const initialScan = async () => {
      await scanWallet()
    }
    initialScan()
  }

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.wrapper}>
      {/* page title */}
      <div className={styles.top}>
        <div className={styles.top__title}>
          Withdraw from <span>BNS</span>
        </div>
      </div>
      <br />
      {/* show control address balance */}
      {state.pageInfo.checkedWallet && <>{showBTC(controlBalance)}</>}

      {/* scan wallet button */}
      <div className={styles.buttonWrapper}>{scanWalletButton()}</div>

      <br />

      {/* show address from which this withdraws */}
      {state.pageInfo.checkedWallet && (
        <div className={styles.from}>
          <div className={styles.from__label}>From control address</div>
          <div className={styles.from__address}>{state.wallet.address}</div>
        </div>
      )}

      <br />

      {state.pageInfo.checkedWallet && (
        <>
          {/* editable to address */}
          <InputForm
            className={styles.withdraw_control}
            thisInputLabel={`Send to`}
            showButton={'true'}
            sanitizeFilters={['basic']}
            thisInputOnChange={(e: any) => {
              setWithdrawAddress(e.target.value)
            }}
            thisSubmitButtonOnClick={() => {
              console.log('submitting withdrawal to wallet')

              /* ----------------------------- loading wallet ----------------------------- */

              // clone utxo
              const utxoList = JSON.parse(JSON.stringify(state.wallet.utxoList))
              // load inputs w/ additional data
              utxoList.forEach((utxo: any) => {
                utxo.sequence = 0xfffffffe
                utxo.canJustSign = true
                utxo.keyPairs = [state.wallet.WIF] // (TODO: remove later)
                utxo.sighashTypes = ['SIGHASH_ALL'] // SIGHASH_ALL or 0x01
                utxo.address = state.wallet.address
                utxo.confirmed = true
                utxo.info = 'BNS control wallet'
              })
              // send each element of payload to session storage for wallet
              const payload: { [key: string]: any } = {
                network: state.network,
                // wallet utxo's
                utxoList,
                // specific outputs
                outputsFixed: {
                  '0': {
                    address: withdrawAddress,
                    value: 5000 // (TODO test replace)
                  }
                },
                // change sent back
                changeAddress: state.wallet.address
              }
              addToSessionStorage(payload)
            }}
          />
        </>
      )}
      {/* <div>to address</div>
      <div>to amount</div>
      <div>returned amount</div>
      <div>broadcast button</div> */}
    </div>
  )
}

/* ------------------------- add to session storage ------------------------- */
const addToSessionStorage = (payload: any) => {
  // add stringified payload to session storage under 'toWallet' key
  window.sessionStorage.setItem('toWallet', JSON.stringify(payload))
  // this appears necessary
  window.dispatchEvent(new StorageEvent('storage'))
}
