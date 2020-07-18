import React from 'react'
import styles from './Wallet.module.css'
import { getTx } from './getTx'
import { Logo } from './../../general/Logo/'
import { RoundButton } from '../../general/RoundButton'
import { InputForm } from './../../general/InputForm'
import { FeesSelection } from './../FeesSelection'

const RESERVED_FROM_WALLET_KEY = 'fromWallet'

// which feeds to use
const USE_URL_AS_SOURCE = false
const USE_SESSION_STORAGE_AS_SOURCE = true
// if development mode
const TESTING = process.env.NODE_ENV === 'development'

// written so easy to separate into separate app later

// logic flow
// outside wallet -> params -> txBuilder -> user
// separating params and txBuilder to place formatting logic

// session storage temporarily used instead of other means like URI to be dropped in later
// entry toWallet is used to send data to wallet
// entry fromWallet is used to send data from wallet

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

/**
 * Reusable component for creating a wallet.
 * Simulates behavior of browser/desktop wallet plugins so I can move it outside later.
 */
export const Wallet = (props: any): JSX.Element => {
  // initialize
  const [initialized, setInitialized] = React.useState(false)

  // show pop up interface
  const [showInterface, setShowInterface] = React.useState(false)

  // stores raw fed params before organizing them for txBuilder
  const [params, setParams]: [any, (args: any) => void] = React.useState({})

  // stores state useful for building tx
  const [txBuilder, setTxBuilder]: [I_TxBuilder | null, any] = React.useState(
    null
  )
  // initializes txbuilder state from initial state and passed props
  if (txBuilder === null) {
    setTxBuilder({
      ...initialTxBuilder,
      ...(!!props.txBuilder ? props.txBuilder : {})
    })
  }

  // gui settings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [info, setInfo] = React.useState({ text: '' })

  // run methods to handle evenlisteners for new parameters from all sources
  // React.useEffect(() => handleListeners(params, setParams), [params])
  if (!initialized) {
    setInitialized(true)
    handleListeners(params, setParams)
  }

  // run methods to move new parameters 'params' into txBuilder
  React.useEffect(() => processNewParams(params, setTxBuilder), [params])

  // once fed data is organized (on txbuilder changes) attempt to create a transaction
  React.useEffect(
    () =>
      recalcBuilder({
        txBuilder,
        setTxBuilder,
        setInfo
      }),
    [txBuilder]
  )

  // update on status of wallet interface
  React.useEffect(() => {
    window.sessionStorage.setItem(
      RESERVED_FROM_WALLET_KEY,
      String(showInterface)
    )
  }, [showInterface])

  /* -------------------------------------------------------------------------- */
  /*                                  Rendering                                 */
  /* -------------------------------------------------------------------------- */
  // (TODO) disable testing mode when done
  return TESTING ? (
    <>
      <div
        className={[styles.wrapper, props.className || ''].join(' ')}
        onClick={() => {
          console.log({ params, txBuilder })
          setShowInterface(!showInterface)
        }}
      >
        <div>
          <Logo
            className={[
              styles.logo,
              showInterface ? styles.logo_selected : ''
            ].join(' ')}
            size='var(--wallet__logo_size)'
          />
        </div>
      </div>
      {/* visual interface & hidden background for canceling it */}
      {showInterface && (
        <>
          <div
            className={styles.interface_not}
            onClick={() => {
              setShowInterface(false)
            }}
          />

          <div className={styles.interface}>
            {/* <RoundButton>Receive</RoundButton> */}
            <br />
            <br />
            <br />
            <InputForm thisInputLabel={'Amount (tBTC)'} showButton={'false'} />
            <br />
            <br />
            <br />
            <FeesSelection />
            <br />
            <br />
            <RoundButton>Send</RoundButton>
          </div>
        </>
      )}
    </>
  ) : (
    <></>
  )
}

/* -------------------------------------------------------------------------- */
/*                              helpers (for now)                             */
/* -------------------------------------------------------------------------- */

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
    // get min necessary value from known outputs
    // as that lets us do inputs quickly
    // let outgoingValue = 0
    // Object.keys(params.outputsFixed).forEach((vout: string) => {
    //   outgoingValue += params.outputsFixed[vout].value
    // })

    // add params to txBuilder
    setTxBuilder((prevTxBuilder: any) => ({
      ...prevTxBuilder,
      ...params
      // result: {
      //   ...prevTxBuilder.result,
      //   outgoingValue
      // }
    }))

    // setParams({}) // reset params
  }
}

/* -------------------------------------------------------------------------- */
/*                             attempt to build tx                            */
/* -------------------------------------------------------------------------- */
const recalcBuilder = ({ txBuilder, setInfo }: any) => {
  try {
    // attempt to build within try/catch
    const res = getTx(txBuilder)
    console.log('successful psbt:', res)
  } catch (e) {
    console.log('can not do psbt yet:', e)
    setInfo({ text: e.message })
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
  const foundValues = JSON.parse(
    JSON.parse(JSON.stringify(window.sessionStorage))['toWallet']
  )

  console.log('found values:', foundValues)

  if (foundValues)
    Object.keys(
      // cloned session storage so can delete safely while parsing
      foundValues
    ).forEach((thisKey: string) => {
      if (thisKey !== RESERVED_FROM_WALLET_KEY) {
        const thisValue = foundValues[thisKey]
        fedValues[thisKey] = thisValue

        // clear all session storage
        sessionStorage.removeItem(thisKey)
      }
    })

  // only update state if there are actual values
  if (Object.keys(fedValues).length > 0) {
    const newParams = { ...params, ...fedValues }
    console.log('new params added:', newParams)
    setParams(newParams)
  }

  // safe to add listeners again
  addListeners(params, setParams)
}

// remove params from URL
const resetUrl = () => {
  window.history.pushState({}, '', `${window.location.href.split('?')[0]}`)
  // emit event if param or url change if needs to be detected
  // window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/* -------------------------------------------------------------------------- */
/*                               Initial values                               */
/* -------------------------------------------------------------------------- */

const initialTxBuilder: I_TxBuilder = {
  network: null,
  setVersion: 2,
  setLocktime: 0,
  feeRate: 1.0,

  minFeeRate: 1.0,
  maxFeeRate: 1000.0,
  minDustValue: 500,

  result: {
    tx: null,
    hex: null,
    virtualSize: 0, // vbytes
    outgoingValue: 0, // sats in outputs have to pay
    changeValue: 0, // sats in output returning
    inputsValue: 0,
    fee: 0 // sats going to miners
  },

  inputs: {},
  inputsFixed: {},
  utxoList: null,

  outputs: {},
  outputsFixed: {},
  changeAddress: null
}

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

// everything I need to build any tx
// matching as close as possible to bitcoinjs psbt design
export interface I_TxBuilder {
  network: 'bitcoin' | 'testnet' | null
  setVersion: number | null
  setLocktime: number | null
  feeRate: number | null

  // some safety things to check
  minFeeRate: number | null // sat/vByte
  maxFeeRate: number | null // sat/vByte
  minDustValue: number | null // sats

  result: {
    tx: ObjectOrNull
    hex: string | null
    virtualSize: number
    outgoingValue: number
    changeValue: number
    inputsValue: number
    fee: number
  }

  // used inputs
  inputs: {
    [inputIndex: string]: I_Input
  }

  // MUST USE / USED inputs as exact input info object with input index as keys
  // so specific indexes can be set by user, the rest filled in automiatcally.
  inputsFixed: {
    [inputIndex: string]: I_Input
  }

  // OPTIONAL INPUTS:
  // array of other possible inputs to use,
  // used in exact order of this array,
  // priority given to defined inputs always.
  // (TODO) if only address + keys given, wallet could get missing info
  // to create 1-multiple inputs from 1 address
  // adds to inputs if used
  utxoList: Array<any> | null

  // used outputs
  outputs: {
    [outputIndex: string]: {
      address: string | null // standard tx to address that will generate output at that addrss

      // for OP_RETURN that has no address can be fed for with data to embed
      // bitcoin.payments.embed({ data: [bufferOfDataToEmbed] }).output
      script: Buffer | null

      value: number | null // sats we need to pay
    }
  }

  // MUST use outputs
  outputsFixed: {
    [outputIndex: string]: {
      address: string | null
      script: Buffer | null
      value: number | null
      minValue: number
    }
  }

  changeAddress: string | null // where left over change goes, adds to outputs if used
}

type ObjectOrNull = Exclude<{ [any: string]: any } | null, undefined>

interface I_Input {
  // to create input

  hash: string | null // txid (32B, 64 char hex) (dislike little endian buffer)
  index: number | null // vout (integer)
  sequence: number | null // e.g. 0xfffffffe
  nonWitnessUtxo: Buffer | null // raw tx buffer, only 1 that works for all types
  witnessScript: Buffer | null // original script, via bitcoin.script.compile([opcodes, ...])
  redeemScript: Buffer | null // original script, via bitcoin.script.compile([opcodes, ...])

  // to sign and finalize:

  // could do from asm and pass as string instead of function
  // then replace signature<index> publickey<index> with matching
  // keyPairs[index] and if needed sighashTypes[index], numbers can be encoded
  // into string before.
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/f48abd322f14f6eec8bfc19e7838a1a150eefb56/test/integration/cltv.spec.ts#L43
  // ((TODO): psbt.getHashForSig , .hashForSignature , hashForWitnessV0 , keypair.sign(hash))
  inputScript: string | null

  // ( (TODO):
  //  canJustSign:
  //    true means wallet just use
  //      psbt.signInput(vin, keyPair); psbt.finalizeInput(vin);
  //    false means it is fancy script so have to feed it
  //      psbt.finalizeInput(vin, getFinalScripts({ inputScript, network }))
  // )
  canJustSign: boolean | null
  keyPairs: ObjectOrNull[] | null
  sighashTypes: number[] | null

  // to explain to user each value when waiting for confirmation
  address: string | null
  value: number | null
  confirmed: boolean | null
  info: string | null
}

/* -------------------------------------------------------------------------- */
/*                                 Temp notes                                 */
/* -------------------------------------------------------------------------- */

/**
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

/* -------------------------------------------------------------------------- */
/*                           reading params from url                          */
/* -------------------------------------------------------------------------- */

// curried url change handler
const handleHashChange = (params: any, setParams: any) => (): void => {
  // if (e) console.warn(e)

  // convert url string starting with # into key/value pair object
  // #/ok/?a=b&c=d becomes { a:b, c:d }
  const fedValues = window.location.hash
    .split('#')
    .slice(1) // removes all before 1st # and 1st #
    .join('')
    .split('?')
    .slice(1) // removes all before 1st ? and 1st ?
    .join('')
    .split('&') // split between sets of key-value pairs
    .reduce((finalParamObject: any, thisKeyValue: string) => {
      // assume values were passed through encodeURIComponent() so only '=' are from standard format
      const splitKeyValue = thisKeyValue.split('=')
      const thisKey = splitKeyValue[0]
      const thisValue = decodeURIComponent(splitKeyValue[1])
      if (thisKey === '') {
        // no change
        return finalParamObject
      } else {
        // check if key/value already exist within params
        if (thisKey in params && params[thisKey] === thisValue) {
          // if so, no need to add
          return finalParamObject
        } else {
          // add changes
          console.log(thisKey)
          return { ...finalParamObject, [thisKey]: thisValue }
        }
      }
    }, {})

  // only update state if there are new values, avoid pointless refresh
  if (Object.keys(fedValues).length > 0) {
    const newParams = { ...params, ...fedValues }
    console.log('new params added:', newParams)
    setParams(newParams)
  }

  // clean up url as well
  resetUrl()
}

/* -------------------------------------------------------------------------- */
/*                        dummy example for type checks                       */
/* -------------------------------------------------------------------------- */

// const dummyInput: I_Input = {
//   hash: 'abc123',
//   index: 123,
//   sequence: 0xfffffffe,
//   nonWitnessUtxo: Buffer.from(' ', 'utf8'),
//   witnessScript: Buffer.from(' ', 'utf8'),
//   redeemScript: Buffer.from(' ', 'utf8'),
//   inputScript: 'OP_TRUE OP_DROP OP_TRUE',
//   canJustSign: false,
//   keyPairs: [ { some: 'object' } ],
//   sighashTypes: [ 1 ],
//   address: '123abc',
//   value: 123,
//   confirmed: true,
//   info: 'why'
// }

// const dummyTxBuilder: I_TxBuilder = {
//   network: 'testnet',
//   setVersion: 2,
//   setLocktime: 0,
//   feeRate: 1.0,

//   minFeeRate: 1.0,
//   maxFeeRate: 1000.0,
//   minDustValue: 500,

//   result: {
//     tx: { bitcoinjslibtxobject: 'returned here' },
//     hex: 'abc1234',
//     virtualSize: 123
//   },

//   inputs: {
//     // eslint-disable-next-line no-useless-computed-key
//     ['1']: dummyInput
//   },
//   fillInputs: [dummyInput],

//   outputs: {
//     // eslint-disable-next-line no-useless-computed-key
//     ['1']: {
//       address: 'abc',
//       script: Buffer.from(' ', 'utf8'),
//       value: 123
//     }
//   },
//   changeAddress: 'abc'
// }
