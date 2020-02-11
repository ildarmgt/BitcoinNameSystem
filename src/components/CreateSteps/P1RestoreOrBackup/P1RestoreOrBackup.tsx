import React, { useState } from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P1RestoreOrBackup.module.css'
import { createNewWalletAction, changePageInfoAction } from '../../../store/actions/'
import sanitize from './../../../helpers/sanitize'
import { Store } from './../../../store/'
import { Details } from './../../general/Details'

enum pages {
  ROOT,
  NEW_WALLET,
  LOAD_BACKUP
}

// restore backup or create new
export const P1RestoreOrBackup = () => {
  const { state, dispatch } = React.useContext(Store) // global state
  const [ page, setPage ] = useState(pages.ROOT) // local state
  const [ backup, setBackup ] = useState('') // local state

  // count non empty string strings separated by spaces
  const wordCount = backup.split(' ').filter(v => v !== '').length

  return (
    <div className={ styles.wrapper }>

      {/* ROOT PAGE */}
      <div
        style={{ display: page === pages.ROOT ? 'block' : 'none' }}
      >
        <div
          className={ styles.title }
        >
          { state.wallet.address ? (<>
            Your <span className={ styles.Orange }>BTC</span> wallet for interacting<br />
            with the domains
          </>) : (<>
            Need a <span className={ styles.Orange }>BTC</span> wallet for interacting<br />
            with the domains
          </>) }
        </div>
        <div>
          <Details
            description={ 'Explanation' }
          >
            <p>
              <span>This wallet has the built-in unique functionality to create transactions with custom scripts, inputs, and outputs necessary for this application.</span>

              <span>The wallet's address is how users and owners of the domains are identified and should only be used for this purpose.</span>

              <span>1. BIP39 mnemonic is used from backup or generated</span>
              <span>2. BIP32 master seed is derived from the mnemonic</span>
              <span>3. Key pair is derived at the m/44'/0'/0'/0/0 path from master seed</span>
              <span>4. The p2wpkh (pay-to-witness-public-key-hash) address is derived from key pair</span>
            </p>
          </Details>
        </div>
        <div
          className={ styles.buttonWrapper }
        >
          <RoundButton
            show={ (state.wallet.mnemonic.length > 0) ? 'false' : 'true' }
            onClick={() => {
              setPage(pages.NEW_WALLET)
              createNewWalletAction(state, dispatch)
            }}
          >
            I need a new wallet
          </RoundButton>
          <RoundButton
            show={ (state.wallet.mnemonic.length > 0) ? 'true' : 'false' }
            onClick={() => {
              setPage(pages.NEW_WALLET)
            }}
          >
            Current backup
          </RoundButton>
          <RoundButton
            onClick={() => {
              setPage(pages.LOAD_BACKUP)
            }}
          >
            Restore from backup
          </RoundButton>
          <RoundButton
            show={ (!!state.wallet?.address).toString() }
            onClick={() => {
              changePageInfoAction(state, dispatch, 2)
            }}
            next='true'
          >
            Don't change wallet
          </RoundButton>
        </div>
      </div>

      {/* NEW_WALLET PAGE */ }

      <div
        className={ styles.contentWrapper }
        style={{ display: page === pages.NEW_WALLET ? 'flex' : 'none' }}
      >
        <div className={ styles.describe }>
          Randomly generated for domain control
          <br /><br />
          Backup this private phrase
          or you will lose access
        </div>
        <div
          id='divBackup'
          spellCheck={ false }
          className={ [styles.backup, 'selectable'].join(' ') }
          onClick={ () => {
            // select div entire contents
            // const thisDiv = document?.getElementById('divBackup')
            // if (thisDiv) {
            //   window.getSelection()?.selectAllChildren(thisDiv)
            // }
          }}
        >
          { state.wallet.mnemonic }
        </div>
        <div className={ styles.buttonWrapper } >
          <RoundButton
            onClick={() => {
              setPage(pages.ROOT)
            }}
            back='true'
          >
            Back
          </RoundButton>
          <RoundButton
            onClick={() => {
              setPage(pages.NEW_WALLET)
              createNewWalletAction(state, dispatch)
            }}
          >
            New
          </RoundButton>
          <RoundButton
            next='true'
            onClick={() => {
              changePageInfoAction(state, dispatch, 2)
            }}
          >
            I'm done with backup
          </RoundButton>
        </div>
      </div>

      {/* LOAD_BACKUP PAGE */ }

      <div
        style={{ display: page === pages.LOAD_BACKUP ? 'block' : 'none' }}
      >
        <div className={ styles.title }>
          Type or paste your backup here
        </div>
        <br></br>
        <div>
          { (wordCount).toString() + ' words now. 12 minimum.' }
        </div>
        <br></br>
        <textarea
          className={ styles.restoreBackup }
          cols={ 30 }
          rows={ 3 }
          spellCheck={ false }
          placeholder={ 'mnemonic backup' }
          onChange={ e => {
            // lowcaps, spaces, single space max, only one space on left while typing
            const cleanString = sanitize(
              e.target.value.toLowerCase(),
              'lowcaps spaces single_space_width'.split(' ')
            ).trimLeft()
            setBackup(cleanString.trim()) // store without trailing space
            e.target.value = cleanString // quick update
          } }
        ></textarea>
        <div className={ styles.buttonWrapper } >
          <RoundButton
            onClick={() => {
              setPage(pages.ROOT)
            }}
            back='true'
          >
            Back
          </RoundButton>
          <RoundButton
            // 12 words minimum separated by spaces (TODO): proper checks
            show={ (wordCount >= 12) ? 'true' : 'false' }
            next='true'
            onClick={() => {
              createNewWalletAction(state, dispatch, backup)
              changePageInfoAction(state, dispatch, 2)
            }}
          >
            Done
          </RoundButton>
        </div>
      </div>
    </div>
  )
}

