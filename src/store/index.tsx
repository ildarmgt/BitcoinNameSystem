import React from 'react'
import { IState } from '../interfaces'
import reducer from './reducers/Reducer'

// Change state process:
// 1. Component calls action from src/store/actions/
// 2. Action does stuff (e.g. API calls) and dispatches results to reducer in src/store/reducer/
// 3. Reducer modifies state based on dispatched payload and type of action.

// initial state
// (changes to design need to be matched in reducers & interfaces)
export const initialState: IState = {
  network: 'testnet',       // 'testnet' or 'bitcoin'
  alias: 'satoshi',         // first half of domain name
  extension: '.btc',        // last half of domain name
  notifications: {          // notification info for this domain name
    address: '',            // p2wsh address for this domain name (alias + extension)
    txHistory: [],          // array of all tx for this address (old addressHistory)
    utxoList: [],           // array of all current utxo for this address
    checkedHistory: false,  // if notifications tx history has ever been updated
    checkedUtxo: false      // if notifications utxo including raw tx has ever been updated
  },
  wallet: {                 // wallet information & utxo for controlling domain names
    address: '',            // public address (p2wpkh)
    mnemonic: '',           // mnemonic for private key derivation
    WIF: '',                // wallet import format for private key derivation
    txHistory: [],          // array of all tx for this address
    utxoList: [],           // array of all current utxo for this address
    checkedHistory: false,  // if wallet tx history has ever been updated
    checkedUtxo: false      // if wallet utxo including raw tx has ever been updated
  },
  ownership: {              // all details about ownership info for this domain name
    current: {              // current owner only
      address: '',          // address of current owner
      forwards: [],         // array of forwards for this owner
      burnAmount: 0,        // price burnt for ownership
      winTimestamp: 0,      // unix timestamp of winning bid to simplify comparison w/ current time (0 default)
      winHeight: 0,         // block height of win
      updateHeight: 0       // last height of updated
    },
    topBidder: {},          // bidding info (only relevant during challenge time)
    history: [],            // history of ownership
    checked: false          // if ownership info has ever been updated
  },
  chain: {
    height: 0               // height of blockchain
  },
  pageInfo: {               // user navigation information for controlling domain name
    current: 1
  },
  settings: {
    feeRate: 1.1            // fee rate to use in sat/bByte
  },
  lastTimeStamp: Date.now() // last change timestamp, to detect any changes to state or time out
}

export const Store = React.createContext<any>(initialState)
// returns object with .Provider and .Consumer
// Provider makes state available to all child components no matter how deep

// creates wrapping element for global state
export function StoreProvider ({ children }: JSX.ElementChildrenAttribute): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  return (
    <Store.Provider value={{ state, dispatch }}>
      { children }
    </Store.Provider>
  )
}
