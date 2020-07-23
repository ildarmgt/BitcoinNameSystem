import React from 'react'
import styles from './Wallet.module.css'
import { getTx } from './helpers/getTx'
import { resetUrl, handleHashChange } from './helpers/urlReading'
import { Logo } from './../../general/Logo/'
import { RoundButton } from '../../general/RoundButton'
import { InputForm } from './../../general/InputForm'
import { FeesSelection } from './../../general/FeesSelection'
import { I_Wallet, I_TxBuilder, I_Attempt, Mode } from './interfaces'
import { initialWallet, initialTxBuilder } from './store'

const RESERVED_FROM_WALLET_KEY = 'fromWallet'
const RESERVED_TO_WALLET_KEY = 'toWallet'

// which feeds to use
const USE_URL_AS_SOURCE = false
const USE_SESSION_STORAGE_AS_SOURCE = true
// if development mode
// const TESTING = process.env.NODE_ENV === 'development'

// written so easy to separate into separate app later

// logic flow
// outside wallet -> params -> txBuilder -> user
// separating params and txBuilder to place formatting logic

// session storage temporarily used instead of other means like URI to be dropped in later
// entry toWallet is used to send data to wallet
// entry fromWallet is used to send data from wallet

/**
 * Reusable component for creating a wallet.
 * Simulates behavior of browser/desktop wallet plugins so I can move it outside later.
 */
export const Wallet = (props: any): JSX.Element => {
  // initialize
  const [initialized, setInitialized] = React.useState(false)

  // wallet general state
  const [wallet, setWallet]: [I_Wallet, any] = React.useState(initialWallet)

  // stores raw fed params before organizing them for txBuilder
  const [params, setParams]: [any, (args: any) => void] = React.useState({})

  // stores state for building tx
  const [txBuilder, setTxBuilder]: [I_TxBuilder, any] = React.useState({
    ...initialTxBuilder,
    ...(props.txBuilder || {})
  })

  // show/hide pop up interface
  const [showInterface, setShowInterface] = React.useState(false)

  // run methods to handle evenlisteners for new parameters from all sources
  // React.useEffect(() => handleListeners(params, setParams), [params])
  if (!initialized) {
    setInitialized(true)
    handleListeners(params, setParams)
  }

  // run methods to move new parameters 'params' into txBuilder
  React.useEffect(() => processNewParams(params, setTxBuilder), [params])

  // once fed data is organized (on txbuilder changes) attempt to create a transaction
  React.useEffect(() => {
    // handle the change in txBuilder object
    console.log('txBuilder object changed')
    recalcBuilder({ txBuilder })

    // just handle interface showing on/off once
    if (txBuilder.showUI) {
      setShowInterface(true)

      setTxBuilder({ ...txBuilder, showUI: false })
      return undefined
    }

    // just handle mode to load once
    if (txBuilder.loadMode) {
      // checks if string matches enum for mode
      if (Object.values(Mode as any).includes(txBuilder.loadMode)) {
        setWallet((w: I_Wallet) => ({
          ...w,
          mode: txBuilder.loadMode
        }))
        // Mode[txBuilder.loadMode as keyof typeof Mode] as Mode
        setTxBuilder({ ...txBuilder, loadMode: '' })
        return undefined
      }
    }

    // update the headline once
    if (txBuilder.notifyUI) {
      setWallet((w: I_Wallet) => {
        if (txBuilder.notifyUI && txBuilder.notifyUI !== w.headline)
          // update wallet headline
          return { ...w, headline: txBuilder.notifyUI }
        else if (txBuilder.notifyUI && txBuilder.notifyUI === w.headline)
          // no changes to wallet headline
          return w
        // reset wallet headline
        else return { ...w, headline: initialWallet.headline }
      })

      setTxBuilder({ ...txBuilder, notifyUI: '' })
      return undefined
    }
  }, [txBuilder])

  // update session storage about interface showing
  React.useEffect(() => {
    window.sessionStorage.setItem(
      RESERVED_FROM_WALLET_KEY,
      String(showInterface)
    )
  }, [showInterface])

  // (TODO) separate views into separate components

  /* ------------------------------ sending view ------------------------------ */
  const viewSending = (props: any) => (
    <>
      <div className={styles.title}>{wallet.headline}</div>

      {/* allow fee customization */}
      <FeesSelection
        className={styles.feeSelection}
        initialFee={txBuilder.feeRate}
        getFeeSuggestions={() => props.api.getFeeSuggestions()}
        setFee={(feeRate: string) => {
          if (+feeRate > txBuilder.maxFeeRate)
            feeRate = String(txBuilder.maxFeeRate)
          if (+feeRate < txBuilder.minFeeRate)
            feeRate = String(txBuilder.minFeeRate)
          props.export.feeRate(parseFloat(feeRate)) // outside wallet
          setTxBuilder({ ...txBuilder, feeRate: parseFloat(feeRate) }) // inside wallet
          return feeRate
        }}
      />

      {/* amount customization */}
      {Object.keys(txBuilder!.outputsFixed).map(
        (vout: string, index: number) => {
          const output = txBuilder!.outputsFixed[vout]
          return (
            <InputForm
              key={'outputform' + String(index)}
              className={styles.amounts}
              thisInputLabel={`Amount sent (${
                txBuilder!.network === 'testnet' ? 'tBTC' : 'BTC'
              })`}
              showButton={'false'}
              thisInitialValue={String(+(output.value * 1e-8).toFixed(8))}
              sanitizeFilters={[
                'fractions',
                'decimal_point',
                'no_leading_zeros',
                'max_decimal_places:8'
              ]}
              thisInputOnChange={(e: any) => {
                // convert string in BTC to number of satoshi
                const thisValue = Math.round(+e.target.value * 1e8)
                // change the fixed output value
                const isChanged = output.value !== thisValue
                output.value = thisValue
                e.target.value = String(+(output.value * 1e-8).toFixed(8))
                // update wallet state w/ new change
                if (isChanged) setTxBuilder({ ...txBuilder })
              }}
            />
          )
        }
      )}

      <div className={styles.buttonWrapper}>
        <RoundButton
          minor={'true'}
          onClick={() => {
            setShowInterface(false)
          }}
        >
          Cancel
        </RoundButton>
        <RoundButton
          showdisabled={txBuilder.result.hex ? undefined : 'true'}
          onClick={async () => {
            console.log('Send clicked')
            // abort if no hex
            if (txBuilder.result.hex === '') return undefined
            console.log('attempting to broadcast')
            console.log('hex:\n', txBuilder!.result.hex)
            try {
              const res = await props.api.broadcastTx(txBuilder.result.hex)
              console.log('broadcast success:', res)
              // add this to historic events
              wallet.history.push({
                describe: `outgoing transaction`,
                txid: res.txid,
                message: '',
                success: true,
                txBuilder: JSON.parse(JSON.stringify(txBuilder)),
                timestamp: Date.now()
              })
            } catch (e) {
              console.log('broadcast failed:', e)
              // add this to historic events
              wallet.history.push({
                describe: `outgoing transaction`,
                txid: '',
                message: e.message,
                success: false,
                txBuilder: JSON.parse(JSON.stringify(txBuilder)),
                timestamp: Date.now()
              })
            }
            wallet.mode = Mode.HISTORY
            setWallet({ ...wallet })
          }}
        >
          Send
        </RoundButton>
      </div>
    </>
  )

  /* ------------------------------ view history ------------------------------ */
  const viewHistory = () => (
    <>
      <div className={styles.title}>Past transactions</div>
      <div className={styles.entries}>
        {wallet.history
          .slice()
          .reverse()
          .map((entry: I_Attempt, index: number) => (
            <div
              key={`historicEntry_${index}`}
              className={styles.entries__entry}
            >
              <div
                className={
                  entry.success
                    ? styles.entries__entry__done
                    : styles.entries__entry__error
                }
              >
                {entry.describe} : {entry.success ? 'Done' : 'Failed'}
              </div>
              {entry.success ? (
                <RoundButton
                  className={styles.entries__entry__button}
                  minor={'true'}
                  onClick={() => {
                    const PATH =
                      `https://blockstream.info/` +
                      `${
                        entry.txBuilder.network === 'testnet' ? 'testnet/' : ''
                      }tx/` +
                      `${entry.txid}`
                    window.open(PATH, '_blank')
                  }}
                >
                  See online
                </RoundButton>
              ) : (
                <div className={styles.entries__entry__message}>
                  {entry.message}
                </div>
              )}
              <div className={styles.entries__entry__time}>
                {new Date(entry.timestamp).toUTCString()}
              </div>
            </div>
          ))}
      </div>
    </>
  )

  /* ------------------------------ general view ------------------------------ */

  const viewMain = () => (
    <>
      <div className={styles.title}>BNS Wallet</div>
      <div>not loaded</div>
    </>
  )

  /* -------------------------------------------------------------------------- */
  /*                                  Rendering                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      {/* visual wallet interface */}
      {showInterface && (
        <>
          {/* hidden full screen div for closing wallet interface */}
          <div
            className={styles.interface_not}
            onClick={() => {
              setShowInterface(false)
            }}
          />

          {/* visible wallet interface */}
          <div className={styles.interface}>
            {/* views to render */}
            {wallet.mode === Mode.SENDING && viewSending(props)}
            {wallet.mode === Mode.HISTORY && viewHistory()}
            {wallet.mode === Mode.MAIN && viewMain()}
          </div>
        </>
      )}

      {/* wallet icon */}
      <div
        className={[styles.logo_wrapper, props.className || ''].join(' ')}
        onClick={() => {
          console.log({ params, txBuilder, wallet })
          setShowInterface(!showInterface)
        }}
      >
        <div>
          <Logo
            className={[
              styles.logo,
              showInterface ? styles.logo_selected : ''
            ].join(' ')}
          />
        </div>
      </div>
    </>
  )
}

/* --------------------------------- helpers -------------------------------- */

// if events not firing need to use
// window.dispatchEvent(new Event('storage'))

// Run methods to handle detection and clean up of parameters passed.
// Was easiest to do it with access to params.
const handleListeners = (params: any, setParams: any) => {
  // Events added to move user data from listening sources to params
  addListeners(params, setParams)

  // clean up function is returned to run if component is removed (or changed)
  return () => {
    // clean up listeners
    removeListeners(params, setParams)

    // clean up url as well
    if (USE_URL_AS_SOURCE) resetUrl()
  }
}

/* -------------------------------------------------------------------------- */
/*                               event listeners                              */
/* -------------------------------------------------------------------------- */

const addListeners = (params: any, setParams: any) => {
  // even to detect session storage edit
  if (USE_SESSION_STORAGE_AS_SOURCE)
    window.addEventListener('storage', handleStorageChange(params, setParams))

  // event to detect url change
  if (USE_URL_AS_SOURCE)
    window.addEventListener('hashchange', handleHashChange(params, setParams))
}

const removeListeners = (params: any, setParams: any) => {
  // clean up storage listener
  if (USE_SESSION_STORAGE_AS_SOURCE)
    window.removeEventListener(
      'storage',
      handleStorageChange(params, setParams)
    )

  // clean up url hash listener
  if (USE_URL_AS_SOURCE)
    window.removeEventListener(
      'hashchange',
      handleHashChange(params, setParams)
    )
}

/* -------------------------------------------------------------------------- */
/*                convert matching params to wallet properties                */
/* -------------------------------------------------------------------------- */
const processNewParams = (params: any, setTxBuilder: any) => {
  // only update state if necessary
  if (Object.keys(params).length > 0) {
    // add params to txBuilder
    setTxBuilder((prevTxBuilder: any) => ({
      ...prevTxBuilder,
      ...params
    }))
  }
}

/* -------------------------------------------------------------------------- */
/*                             attempt to build tx                            */
/* -------------------------------------------------------------------------- */
const recalcBuilder = ({ txBuilder }: any) => {
  try {
    // attempt to build within try/catch
    const res = getTx(txBuilder)
    console.log('successful tx done:\n', res)
  } catch (e) {
    console.log('can not do psbt yet:', e)
    // setInfo({ text: e.message })
  }
}

/* -------------------------------------------------------------------------- */
/*                    reading params from sessions storage                    */
/* -------------------------------------------------------------------------- */

/**
 * Session storage scan. Read key value pairs, clean session storage after.
 */
const handleStorageChange = (params: any, setParams: any) => (): void => {
  // if (e) console.warn(e)
  console.log('handle Storage Change ran')

  // do not want spam of events going off in middle of this
  removeListeners(params, setParams)

  const fedValues: { [key: string]: string } = {}

  // check for data sent to wallet
  const found = window.sessionStorage[RESERVED_TO_WALLET_KEY]
  const foundObject = found
    ? JSON.parse(window.sessionStorage[RESERVED_TO_WALLET_KEY])
    : null

  console.log('found values:', foundObject)

  if (foundObject)
    Object.keys(
      // cloned session storage so can delete safely while parsing
      foundObject
    ).forEach((thisKey: string) => {
      const thisValue = foundObject[thisKey]
      fedValues[thisKey] = thisValue
    })

  // only update state if there are actual values
  if (Object.keys(fedValues).length > 0) {
    const newParams = { ...params, ...fedValues }
    console.log('new params added:', newParams)
    setParams(newParams)
  }

  // clear session storage
  // sessionStorage.removeItem(RESERVED_TO_WALLET_KEY)

  // safe to add listeners again
  addListeners(params, setParams)
}

/**
 * temp notes
 *
 * what's best for passing data?
 * - querry strings
 *    - users can accidentally edit or on purpose (I like that it's visible and customizable)
 *    - works cross origin (just put in confirmation checks)
 *    - needs unique path or could be confusing to other components
 *    - confusing url for user (needs cleanup after read imo)
 *    - much less data can be passed (so have to get your own data)
 *    - if pass ? after #, not querry string so no forced refresh
 *      and separate from querry string search links
 *
 * - local storage
 *    - cross origin safe
 *    - harder to accidentally edit but also harder to customize
 *    - invisible to user
 *    - persistent across browser sessions
 *    - significant size, more than block size!
 *
 * - session storage
 *    - same as local storage but erased between browser sessions*
 *
 */

// url parameters after #:

// value could have base58 or similar so it's encoded
// keys are kept simple
// encodeURIComponent() escapes all characters except: A-Z a-z 0-9 - _ . ! ~ * ' ( )
// e.g. const randomDataFed1 = 'who1=' + encodeURIComponent('878b8=ABCD-=+_`' + Math.random().toFixed(2))

// window.origin is url up to but not including '/' before the '#'
// search params are found after '?' but before the '#'
// window.location.pathname is path after window.origin but before #
// then the rest is window.hash that includes # and everything after
// '?' after # are not search params so can be separate

// other way to update url:
// window.history.replaceState({}, '', `${location.pathname}?${params}`);

// sessionStorage is bound not only to the origin, but also to the browser tab
// survives page refresh but not tab close and never seen by another tab
// https://javascript.info/localstorage
// combined with encryption sounds good
// only data

// Save data to sessionStorage
// sessionStorage.setItem('key', 'value');
// Get saved data from sessionStorage
// let data = sessionStorage.getItem('key');
// Remove saved data from sessionStorage
// sessionStorage.removeItem('key');
// Remove all saved data from sessionStorage
// sessionStorage.clear();

// props are unescaped and many times appear in html, most dangerous

// https://owasp.org/www-community/xss-filter-evasion-cheatsheet

// user feeds data into wallet component from any of following (if enabled):
// 1. props (object with key:values inside props.txBuilder)
// 2. querry strings (#*?key=value&key=value format, values with encodeURIcomponent encoding)
// 3. session storage with (key:JSON.stringify(value))
// 4. via forms in wallet gui
// querry strings and session storage is wiped after data is copied
// all new values are fed into same 'params' local state
// 'params' key:values are processed and added in correct formats to 'txBuilder' state
// 'txBuilder' state changes trigger updated calculations
// user can check what's missing
// user is notified if tx is ready (session storage)
