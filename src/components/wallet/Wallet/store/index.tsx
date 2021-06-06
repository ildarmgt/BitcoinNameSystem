import { I_Wallet, I_TxBuilder, Mode } from './../interfaces'

export const initialWallet: I_Wallet = {
  headline: `Set up your wallet`,
  mode: Mode.MAIN,
  history: [],
  lastError: ''
}

export const initialTxBuilder: I_TxBuilder = {
  // notifying wallet
  showUI: false,
  notifyUI: '',
  loadMode: '',

  // tx data
  network: 'testnet',
  setVersion: 2,
  setLocktime: 0,
  feeRate: 1.0,

  minFeeRate: 1.0,
  maxFeeRate: 1000.0,

  minDustValue: 500,

  result: {
    hex: '',
    virtualSize: 0,
    outgoingValue: 0,
    minOutgoingValue: 0,
    changeValue: 0,
    inputsValue: 0,
    availableInputsValue: 0,
    fee: 0,
    txid: ''
  },

  inputs: {},
  inputsFixed: {},
  utxoList: null,

  outputs: {},
  outputsFixed: {},
  changeAddress: null
}
