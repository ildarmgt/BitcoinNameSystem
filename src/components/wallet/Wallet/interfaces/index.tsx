export enum Mode {
  HISTORY = 'HISTORY',
  SENDING = 'SENDING',
  MAIN = 'MAIN'
}

export interface I_Attempt {
  describe: string // describe what happened briefly
  txid: string // txid for clicking if possible
  message: string // error message
  success: boolean // ok or bad?
  txBuilder: I_TxBuilder // detailed clone object
  timestamp: number // timestamp for sorting
}

export interface I_Wallet {
  headline: string // title
  mode: string | Mode // page
  history: I_Attempt[] // previous actions
  lastError: string
}

// everything I need to build any tx
// matching as close as possible to bitcoinjs psbt design
export interface I_TxBuilder {
  showUI: boolean // show UI
  notifyUI: string // what to set wallet title to
  loadMode: string // what mode to load

  network: 'bitcoin' | 'testnet' // testnet or bitcoin
  setVersion: number | null // tx version
  setLocktime: number | null // default locktime

  feeRate: number | null // starting fee rate

  minFeeRate: number // min fee rate sat/vByte
  maxFeeRate: number // max fee rate sat/vByte
  minDustValue: number | null // smallest output value (except OP_RETURN) sats

  result: {
    hex: string // hex of tx
    virtualSize: number // vbytes
    outgoingValue: number // sats initial outputs to pay (not change)
    minOutgoingValue: number // min sats outputs allowed (not change)
    changeValue: number // sats in output returning (change)
    inputsValue: number // sats in used inputs
    availableInputsValue: number // max sats available for inputs
    fee: number // sats going to miners
    txid: string // txid of tx
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

      value: number // sats we need to pay
      info: string
    }
  }

  // MUST use outputs
  outputsFixed: {
    [outputIndex: string]: {
      address: string | null
      script: Buffer | null
      value: number
      minValue: number
      info: string
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
