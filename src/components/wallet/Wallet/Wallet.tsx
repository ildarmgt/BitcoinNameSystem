import React from 'react'
import styles from './Wallet.module.css'
// import { psbt } from './psbt'






/**
 * Reusable component for creating a wallet.
 * Let's pass obvious data via props.
 * Simulates behavior of browser wallet plugins without needing them. *
 */
export const Wallet = (props: any): JSX.Element => {
  // stores and initializes tx builder from initial state and passed props
  const [txBuilder, setTxBuilder]: [I_TxBuilder | null, any] = React.useState(null)
  if (txBuilder === null) setTxBuilder({
    ...initialTxBuilder,
    ...(!!props.txBuilder ? props.txBuilder : {})
  })


  // stores fed params
  const [params, setParams]: [any, (args: any) => void] = React.useState({})

  // run methods to handle detection and processing of parameters after '#' in URL
  React.useEffect(() => handleParamsChanges(params, setParams), [params])

  return (
    <div className={ styles.wrapper }
      onClick={ () => {
        console.log({ params, txBuilder })
      } }
    >
      { (TESTING) && (
        <>
          log state
        </>
      ) }
    </div>
  )
}


/* -------------------------------------------------------------------------- */
/*                              helpers (for now)                             */
/* -------------------------------------------------------------------------- */

// run methods to handle detection and processing of parameters after '#' in URL
const handleParamsChanges = (params: any, setParams: any) => {

  // event to detect url change
  window.addEventListener('hashchange', handleHashChange(params, setParams))
  return () => {
    // clean up function is returned to run if component is removed (or changed)
    window.removeEventListener('hashchange', handleHashChange(params, setParams))
    // clean up url as well
    resetUrl()
  }
}

// curried url change handler
const handleHashChange = (params: any, setParams: any) => (e: any): void => {
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
        if ((thisKey in params) && (params[thisKey] === thisValue)) {
          // if so, no need to add
          return finalParamObject
        } else {
          // add changes
          return { ...finalParamObject, [thisKey]: thisValue }
        }
      }
    }, {})

  // only update state if there are new values, avoid pointless rerenders
  if (Object.keys(fedValues).length > 0) {
    const newParams = { ...params, ...fedValues }
    console.log('new wallet params added:', newParams)
    setParams(newParams)
  }
}

// remove params from URL
const resetUrl = () => {
  window.history.pushState({}, '', `${ window.location.href.split('?')[0] }`)
  // emit event if param or url change needs to be detected
  // window.dispatchEvent(new HashChangeEvent("hashchange"));
}

// if development mode
const TESTING = (process.env.NODE_ENV === 'development')


/* -------------------------------------------------------------------------- */
/*                               Initial values                               */
/* -------------------------------------------------------------------------- */

const initialTxBuilder: I_TxBuilder = {
  network: null,
  setVersion: null,
  setLocktime: null,
  feeRate: null,

  minFeeRate: 1.0,
  maxFeeRate: 1000.0,
  minOutputValue: 500,

  result: {
    tx: null,
    hex: null,
    virtualSize: 0
  },

  inputs: {},
  fillInputs: null,

  outputs: {},
  changeAddress: null
}


/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

// everything I need to build any tx
// matching as close as possible to bitcoinjs psbt design
interface I_TxBuilder {
  network: 'bitcoin' | 'testnet' | null
  setVersion: number | null
  setLocktime: number | null
  feeRate: number | null

  // some safety things to check
  minFeeRate: number | null         // sat/vByte
  maxFeeRate: number | null         // sat/vByte
  minOutputValue: number | null     // sats

  result: {
    tx: ObjectOrNull
    hex: string | null
    virtualSize: number | null
  }

  // MUST USE / USED inputs as exact input info object with input index as keys
  // so specific indexes can be set by user, the rest filled in automiatcally.
  inputs: {
    [inputIndex: string]: I_Input
  }

  // OPTIONAL INPUTS:
  // array of other possible inputs to use,
  // used in exact order of this array,
  // priority given to defined inputs always.
  // (TODO) if only address + keys given, wallet could get missing info
  // to create 1-multiple inputs from 1 address
  // adds to inputs if used
  fillInputs: Array<I_Input> | null

  // MUST use outputs
  outputs: {
    [outputIndex: string]: {
      address: string | null // standard tx to address that will generate output at that addrss

      // for OP_RETURN that has no address can be fed for with data to embed
      // bitcoin.payments.embed({ data: [bufferOfDataToEmbed] }).output
      script: Buffer | null

      value: number | null  // sats we need to pay
    }
  }

  changeAddress: string | null      // where left over change goes, adds to outputs if used

}

type ObjectOrNull = Exclude<
  { [any: string]: any } | null, undefined
>

interface I_Input {
  // to create input

  hash: string | null                       // txid (32B, 64 char hex) (dislike little endian buffer)
  index: number | null                      // vout (integer)
  sequence: number | null                   // e.g. 0xfffffffe
  nonWitnessUtxo: Buffer | null             // raw tx buffer, only 1 that works for all types
  witnessScript: Buffer | null              // original script, via bitcoin.script.compile([opcodes, ...])
  redeemScript: Buffer | null               // original script, via bitcoin.script.compile([opcodes, ...])


  // to sign and finalize:

  // ONLY spenders values for script, same format as scripts,
  // since these can have signatures, have to submit a function that returns script buffer.
  // key pairs + sighashTypes will become sigs[0+] if needed
  // e.g. inputScript: {sigs} => { return bitcoin.script.compile([OP_TRUE, sigs[0]]) }
  // ((TODO): psbt.getHashForSig , .hashForSignature , hashForWitnessV0 , keypair.sign(hash))
  inputScript: (({ sigs }: { sigs: ObjectOrNull[] | null }) => Buffer) | null

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
 *    - if pass ? after #, not querry string so no forced rerender
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