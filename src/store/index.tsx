import React from 'react'
import { I_State } from '../interfaces'
import reducer from './reducers/Reducer'

// Change state process:
// 1. Component calls action from src/store/actions/
// 2. Action does stuff (e.g. API calls) and dispatches results to reducer in src/store/reducer/
// 3. Reducer modifies state based on dispatched payload and type of action.

// initial state
// (changes to design need to be matched in reducers & interfaces)
export const initialState: I_State = {
  network: 'testnet',             // 'testnet' or 'bitcoin'
  alias: 'satoshi',               // first half of domain name
  extension: '.btc',              // last half of domain name
  domain: {                       // domain info from notifications
    domainName: '',
    notificationAddress: '',      // p2wsh address for this domain name (alias + extension)
    txHistory: [],                // array of all tx for this address (old addressHistory)
    utxoList: [],                 // array of all current utxo for this address
    users: {},                    // object with all interacting users
    currentOwner: '',             // address of user that controls domain
    bidding: {},                  // bidding info
    ownersHistory: []             // history of ownership
  },
  wallet: {                       // wallet information & utxo for controlling domain names
    address: '',                  // public address (p2wpkh)
    mnemonic: '',                 // mnemonic for private key derivation
    WIF: '',                      // wallet import format for private key derivation
    txHistory: [],                // array of all tx for this address
    utxoList: [],                 // array of all current utxo for this address
  },
  chain: {
    height: 0                     // height of blockchain
  },
  pageInfo: {                     // user navigation information for controlling domain name
    current: 1,
    checkedDomain: false,         // current domain notification address was scanned
    checkedWallet: false,         // current wallet address was scanned
    checkedLightSearch: false     // if light search was done (no utxo / txhex scan)
  },
  choices: {                      // choices made by user via this app
    action: [],                   // choices and data for action to take
    feeRate: 1.1,                 // fee rate to use in sat/bByte,
    txHex: '',                    // hex of raw transaction, ideally ready for broadcast
    embedString: ''               // string to embed in op_return
  },
  lastTimeStamp: Date.now(),      // last change timestamp, to detect any changes to state or time out
}

// helper methods
export const getOwner = (st: I_State) => {
  const ownerAddress = st.domain.currentOwner
  return st.domain.users[ownerAddress]
}

export const getUser = (st: I_State, address: string) => {
  return st.domain.users[address]
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
