import React, { useState, useEffect } from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P2LoadWallet.module.css'
import { Store } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'
import qr from 'qrcode'
import { useHistory } from 'react-router-dom'


/**
 * Load wallet page, including faucet link for testnet users
 */
export const P2LoadWallet = () => {
  const { state, dispatch } = React.useContext(Store) // global state

  // load QR code into local state
  const [ qrCode, setQrCode] = useState()
  useEffect(() => {
    qr.toDataURL(state.wallet.address, { type: 'image/jpeg' }, (err: any, url: any) => {
      if (!err) { setQrCode(url) }
    })
  }, [state.wallet.address])

  // url changer
  const history = useHistory()

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.contentWrapper }>
        <div
          className={ styles.imgQr }
        >
          {/* downloadable */}
          <img src={qrCode} alt={'QR Code'} />
        </div>
        <div>
          Fund your wallet to interact with domains.
        </div>
        <div className={ [styles.address, 'selectable'].join(' ') }>
          { state.wallet.address }
        </div>
      </div>
      <div className={ styles.buttonWrapper }>
        <RoundButton
          back='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 1)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          next='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 3)
          }}
        >
          Ready
        </RoundButton>
        <RoundButton
          colorbutton={'var(--colorHighlight)'}
          show={ (state.network === 'testnet').toString() }
          onClick={ () => {
            // open faucet page in new window
            // segwit compatible:
            // 1) https://testnet-faucet.mempool.co/
            // 2) https://bitcoinfaucet.uo1.net/
            window.open('https://bitcoinfaucet.uo1.net/', '_blank')
            // window.open('https://testnet-faucet.mempool.co/', '_blank')
          }}
        >
          Testnet: tBTC faucet
        </RoundButton>
        <RoundButton
            show={ (!!state.wallet?.address).toString() }
            onClick={() => {
              history.push('/wallet')
            }}
            colorbutton={'var(--colorHighlight)'}
          >
            Withdraw from wallet
          </RoundButton>
        <RoundButton
          onClick={ () => {
            // open blockstream explorer for address in new window/tab
            const pathEdit = (state.network === 'testnet') ? 'testnet/' : ''
            window.open(
              `https://blockstream.info/${pathEdit}address/${state.wallet.address}`
            , '_blank')
          }}
        >
          Open explorer
        </RoundButton>
      </div>
    </div>
  )
}

