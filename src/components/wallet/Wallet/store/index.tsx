import { I_Wallet, I_TxBuilder } from './../interfaces'

export const initialWallet: I_Wallet = {
  headline: 'Wallet'
}

export const initialTxBuilder: I_TxBuilder = {
  showUI: false, // show UI
  notifyUI: '',
  network: 'testnet', // testnet or bitcoin
  setVersion: 2, // tx version
  setLocktime: 0, // default locktime
  feeRate: 1.0, // starting fee rate

  minFeeRate: 1.0, // min fee rate
  maxFeeRate: 1000.0, // max fee rate

  minDustValue: 500, // smallest output value (except OP_RETURN)

  result: {
    hex: '', // hex of tx
    virtualSize: 0, // vbytes
    outgoingValue: 0, // sats initial outputs to pay (not change)
    minOutgoingValue: 0, // min sats outputs allowed (not change)
    changeValue: 0, // sats in output returning (change)
    inputsValue: 0, // sats in used inputs
    availableInputsValue: 0, // max sats available for inputs
    fee: 0, // sats going to miners
    txid: '' // txid of tx
  },

  inputs: {},
  inputsFixed: {},
  utxoList: null,

  outputs: {},
  outputsFixed: {},
  changeAddress: null
}
