import { I_State } from '../interfaces'
import { newState } from './../helpers/bns/initialState'

/* -------------------------------------------------------------------------- */
/*                                initial state                               */
/* -------------------------------------------------------------------------- */

export const initialState: I_State = {
  network: 'testnet', // 'testnet' or 'bitcoin'
  alias: 'satoshi', // first half of domain name
  extension: '.btc', // last half of domain name
  domain: newState.domain, // using BNS equivalent domain object
  wallet: {
    // wallet information & utxo for controlling domain names
    address: '', // public address (p2wpkh)
    mnemonic: '', // mnemonic for private key derivation
    WIF: '', // wallet import format for private key derivation
    txHistory: [], // array of all tx for this address
    utxoList: [] // array of all current utxo for this address
  },
  chain: {
    height: 0 // height of blockchain
  },
  pageInfo: {
    // user navigation information for controlling domain name
    current: 1,
    checkedDomain: false, // current domain notification address was scanned
    checkedWallet: false, // current wallet address was scanned
    checkedLightSearch: false // if light search was done (no utxo / txhex scan)
  },
  choices: {
    // choices made by user via this app
    action: {}, // choices and data for action to take
    feeRate: 1.1, // fee rate to use in sat/bByte,
    txHex: '', // hex of raw transaction, ideally ready for broadcast
    embedString: '', // string to embed in op_return
    embedBuffers: [] // buffers to embed in op_return
  },
  api: {
    path: {
      bitcoin: 'https://blockstream.info/api/',
      testnet: 'https://blockstream.info/testnet/api/'
    },
    running: false,
    tasks: [],
    rateLimit: 4,
    processId: null
  },
  lastTimeStamp: Date.now() // last change timestamp, to detect any changes to state or time out
}
