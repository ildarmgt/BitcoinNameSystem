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
    qr.toDataURL(state.wallet.address, {
      type: 'image/jpeg', color: { dark: '#111133ff'}
    }, (err: any, url: any) => {
      if (!err) { setQrCode(url) }
    })
  }, [state.wallet.address])

  // url changer
  const history = useHistory()

  return (
    <div className={ styles.wrapper }>
      <div
        className={ styles.title }
      >
        Fund your <span className={ styles.orange }>BTC</span> wallet to interact with domains
      </div>

      <div className={ styles.contentWrapper }>
        <div
          className={ styles.imgQr }
        >
          {/* downloadable */}
          <img src={qrCode} alt={'QR Code'} />
        </div>

        <div className={ [styles.address, 'selectable'].join(' ') }>
          { state.wallet.address }
        </div>
      </div>
      <div className={ styles.buttonWrapper }>

        <div className={ styles.backAndReady }>
          <RoundButton
            className={ styles.button }
            back='true'
            onClick={ () => {
              changePageInfoAction(state, dispatch, 1)
            }}
          >
            Back
          </RoundButton>

          <RoundButton
            className={ styles.button }
            next='true'
            onClick={ () => {
              changePageInfoAction(state, dispatch, 3)
            }}
          >
            Ready
          </RoundButton>
        </div>


        <RoundButton
          className={ styles.button }
          show={ (!!state.wallet?.address).toString() }
          onClick={() => {
            history.push('/wallet')
          }}
          colorbutton={'var(--colorHighlightDark)'}
        >
          Withdraw
        </RoundButton>

        <RoundButton
          className={ styles.button }
          colorbutton={'var(--colorHighlightDark)'}
          show={ (state.network === 'testnet').toString() }
          onClick={ () => {
            // open faucet page in new window
            window.open('https://bitcoinfaucet.uo1.net/', '_blank')
          }}
        >
          Testnet faucet #1
        </RoundButton>

        <RoundButton
          className={ styles.button }
          colorbutton={'var(--colorHighlightDark)'}
          show={ (state.network === 'testnet').toString() }
          onClick={ () => {
            // open faucet page in new window
            window.open('https://testnet-faucet.mempool.co/', '_blank')

          }}
        >
          Testnet faucet #2
        </RoundButton>

        <RoundButton
          className={ styles.button }
          colorbutton={'var(--colorHighlightDark)'}
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

