import * as bitcoin from 'bitcoinjs-lib'
import { I_TxBuilder } from '../interfaces'
import varuint from 'varuint-bitcoin'

/**
 * Handles psbt actions through bitcoinjs-lib.
 * Tx builder (tb) values cannot be undefined, only null or type.
 * Null values will not enter into psbt.
 * Throws tb-specific errors too.
 * vBytes is the max allowed tx size that is within fee rate set.
 */
export const getTx = (tb: I_TxBuilder, vBytesMax = 1): I_TxBuilder => {
  try {
    if (!tb.network)
      throw new Error('Must provide network ("bitcoin" or "testnet")')

    const network = bitcoin.networks[tb.network]

    // initialize psbt object & values
    const psbt = new bitcoin.Psbt({ network })
    initializeValues({ tb, psbt })

    // add exact inputs & adjust outputs if need more for fee
    addInputs({ tb, psbt, vBytesMax })

    // reset outputs from fixedOutputs
    tb.outputs = JSON.parse(JSON.stringify(tb.outputsFixed))

    // add outputs
    addOutputs({ tb, psbt })

    // sign & finalize inputs
    signInputs({ tb, psbt })

    // finalize tx
    const tx = psbt.extractTransaction()
    const thisVirtualSize = tx.virtualSize()

    if (vBytesMax >= thisVirtualSize) {
      // if within fee limit

      // update transction builder
      tb.result.hex = tx.toHex()
      tb.result.virtualSize = thisVirtualSize
      tb.result.txid = tx.getId()

      // console.log some results
      console.log('')
      console.log(`tx with appropriate size calculated:`)
      console.log(tx)
      console.log('hex', tb.result.hex)
      console.log('virtualSize', thisVirtualSize)
      console.log('txid', tb.result.txid)
      console.log('actual fee', tb.result.fee)
      console.log('actual fee rate', tb.result.fee / tb.result.virtualSize)
      console.log('transaction builder object:', tb)
      console.log('')

      // return transaction builder object
      return tb
    } else {
      console.log(
        `tx draft size ${thisVirtualSize} was larger than max of ${vBytesMax} vbytes, recalculating`
      )
      // if above fee limit, redo calc with new fee limit
      return getTx(tb, thisVirtualSize)
    }
  } catch (e) {
    console.log('before', tb)
    initializeValues({ tb })
    console.log('after', tb)
    throw e
  }
}

/* -------------------------------------------------------------------------- */
/*                              Initialize values                             */
/* -------------------------------------------------------------------------- */
const initializeValues = ({ tb, psbt }: { tb: any; psbt?: any }): any => {
  // basic tx settings
  psbt?.setVersion(tb.setVersion)
  psbt?.setLocktime(tb.setLocktime)
  // reset inputs & outputs from fixedInputs
  tb.inputs = JSON.parse(JSON.stringify(tb.inputsFixed))
  tb.outputs = JSON.parse(JSON.stringify(tb.outputsFixed))

  // reset results
  tb.result = {
    hex: '',
    virtualSize: 0,
    outgoingValue: 0,
    minOutgoingValue: 0,
    changeValue: 0,
    inputsValue: 0,
    availableInputsValue: 0,
    fee: 0,
    txid: ''
  }
}

/* -------------------------------------------------------------------------- */
/*                                 add inputs                                 */
/* -------------------------------------------------------------------------- */
const addInputs = ({
  tb,
  psbt,
  vBytesMax
}: {
  tb: any
  psbt: any
  vBytesMax: number
}): any => {
  // add up required "fixed" outputs for required "fixed" outgoing value
  tb.result.outgoingValue = 0
  tb.result.minOutgoingValue = 0
  Object.keys(tb.outputsFixed).forEach((vout: string) => {
    tb.result.minOutgoingValue += tb.outputsFixed[vout].minValue
    tb.result.outgoingValue += tb.outputsFixed[vout].value
    if (tb.outputsFixed[vout].value <= tb.minDustValue)
      throw new Error(
        `Output ${vout} value is below dust setting of ${tb.minDustValue}`
      )
  })

  // use last calculated tx size to calculate fee
  // recursion guarantees fee will not end up smaller than fee rate
  let fee: number = Math.ceil(vBytesMax * tb.feeRate) + 1
  // to cover transfer AND fee, need at least this much from inputs
  const totalNeeded: number = tb.result.outgoingValue + fee

  // match or beat needed sats value with utxo list
  let valueGatheredFromWallet = 0
  const toBeUsedUtxoOfUserWallet: any = []
  tb.result.availableInputsValue = 0

  // go from utxo array to enough utxo to cover withdrawal
  tb.utxoList?.forEach((utxo: any) => {
    tb.result.availableInputsValue += utxo.value
    if (
      valueGatheredFromWallet < totalNeeded ||
      toBeUsedUtxoOfUserWallet.length === 0
    ) {
      toBeUsedUtxoOfUserWallet.push(utxo)
      valueGatheredFromWallet += utxo.value
    }
  })

  // disqualify if more outgoing than all funds available in utxo
  if (tb.result.availableInputsValue < tb.result.outgoingValue) {
    throw new Error(
      'Not enough overall funds available (need: ' +
        (tb.result.outgoingValue / 1e8).toFixed(8) +
        ' BTC, have: ' +
        (tb.result.availableInputsValue / 1e8).toFixed(8) +
        ' BTC)'
    )
  }

  // check if not enough funds
  if (valueGatheredFromWallet < totalNeeded) {
    // check if there's enough funds to subtract the fees from amount to send
    if (tb.result.outgoingValue - fee > tb.result.minOutgoingValue) {
      console.log(
        `Attempting to reduce outputs to get ${fee} sats necessary for fee`,
        tb
      )
      // go through reducing fixed outputs to  attempt to find enough for a fee
      Object.keys(tb.outputsFixed).forEach((vout: string) => {
        if (
          tb.outputsFixed[vout].minValue === undefined ||
          tb.outputsFixed[vout].minValue === null
        ) {
          // just in case set min value to value if it's missing
          tb.outputsFixed[vout].minValue = tb.outputsFixed[vout].value
        }
        console.log(tb.outputsFixed[vout].value, tb.outputsFixed[vout].minValue)
        // this output allows this much reduction in sats
        const slack = Math.max(
          tb.outputsFixed[vout].value - tb.outputsFixed[vout].minValue,
          0
        )
        // this is how much this output & outstanding fee can be reduced by
        const subtractable = Math.min(slack, fee)
        // reduce outstanding fees needed and output value
        fee -= subtractable
        tb.outputsFixed[vout].value -= subtractable

        console.log(
          tb.outputsFixed[vout].value,
          tb.outputsFixed[vout].minValue,
          slack,
          subtractable
        )

        console.log(
          `output ${vout} value had to be decreased from ${tb.outputsFixed[vout]
            .value + subtractable} to ${
            tb.outputsFixed[vout].value
          } resulting in ${fee} sat more necessary to cover the fee`
        )
      })

      // if the fee was covered, redo adding inputs
      if (fee <= 0) {
        // abort this addInputs call and redo it with new outputsFixed values
        return addInputs({ tb, psbt, vBytesMax })
      }
      // otherwise continue to the error below
    }

    // abort since no way to compensate for lacking funds
    throw new Error(
      'Not enough funds available (need: ' +
        (totalNeeded / 1e8).toFixed(8) +
        ' BTC, have: ' +
        (valueGatheredFromWallet / 1e8).toFixed(8) +
        ' BTC)'
    )
  }

  // change is the left over between wallet inputs minus fee minus transfer
  tb.result.changeValue = valueGatheredFromWallet - totalNeeded
  tb.result.fee = fee
  tb.result.inputsValue = valueGatheredFromWallet

  /* ----------------- add detailed info for USED psbt inputs ----------------- */

  toBeUsedUtxoOfUserWallet.forEach((utxo: any, index: number) => {
    tb.inputs[index.toFixed(0)] = {
      hash: utxo.txid,
      index: utxo.vout,
      sequence: utxo.sequence,
      nonWitnessUtxo: Buffer.from(utxo.hex, 'hex'),
      witnessScript: utxo.witnessScript,
      redeemScript: utxo.redeemScript,
      inputScript: utxo.inputScript,

      keyPairs: utxo.keyPairs.map((wif: any) =>
        bitcoin.ECPair.fromWIF(wif, bitcoin.networks[tb.network])
      ),
      // string to bitcoin lib sighash value
      sighashTypes: utxo.sighashTypes.map(
        (sighashType: string) => bitcoin.Transaction[sighashType]
      ),
      canJustSign: utxo.canJustSign,

      // useful info
      address: utxo.address,
      value: utxo.value,
      info: utxo.info
    }
  })

  // check that there has been enough information for at least one input
  if (!tb.inputs || Object.keys(tb.inputs).length === 0) {
    throw new Error(`Can't have no inputs`)
  }

  // check that there's an input for each index up to max
  console.log(`getTx found ${Object.keys(tb.inputs).length.toFixed(0)} inputs`)
  for (let i = 0; i < Object.keys(tb.inputs).length; i++) {
    const thisValue = tb.inputs[i.toFixed(0)]
    if (thisValue === undefined) {
      throw new Error(`Missing input at vin index ${i.toFixed(0)}`)
    }
  }

  // check and add each exact input to PSBT
  // thisInput is what goes into PSBT
  // tb.inputs is my personal detailed input data
  Object.keys(tb.inputs).forEach((thisVin: string, i: number) => {
    // check that input key matches current index
    if (thisVin !== i.toFixed(0))
      throw new Error(`Wrong labeled input with key ${thisVin}`)

    const thisInput = tb.inputs[thisVin]

    // required values
    if (thisInput.hash === undefined)
      throw new Error(`Missing txid on input #${thisVin}`)
    if (thisInput.index === undefined)
      throw new Error(`Missing vout on input #${thisVin}`)
    if (thisInput.sequence === undefined)
      throw new Error(`Missing sequence on input #${thisVin}`)
    if (thisInput.nonWitnessUtxo === undefined)
      throw new Error(`Missing input's full tx hex on input #${thisVin}`)

    const inputBuilder: any = {
      hash: thisInput.hash,
      index: thisInput.index,
      sequence: thisInput.sequence,
      nonWitnessUtxo: thisInput.nonWitnessUtxo
    }

    // optional values

    if (thisInput.witnessScript)
      inputBuilder.witnessScript = thisInput.witnessScript
    if (thisInput.redeemScript)
      inputBuilder.redeemScript = thisInput.redeemScript

    // (TODO) calc sigs for inputScript
    // could do from asm and pass as string instead of function
    // then replace signature<index> publickey<index> with matching
    // keyPairs[index] and if needed sighashTypes[index], numbers can be encoded
    // into string before.
    // https://github.com/bitcoinjs/bitcoinjs-lib/blob/f48abd322f14f6eec8bfc19e7838a1a150eefb56/test/integration/cltv.spec.ts#L43
    if (thisInput.inputScript)
      inputBuilder.inputScript = bitcoin.script
        .fromASM(inputBuilder.inputScript)
        .trim()
        .replace(/\s+/g, ' ')

    // If witness or redeem script are provided it means inputscript is necessary to spend output
    if (
      (thisInput.witnessScript || thisInput.redeemScript) &&
      !thisInput.inputScript
    ) {
      throw new Error(`
        Missing input script on input #${thisVin} but provided
        ${thisInput.witnessScript ? ' witness ' : ''}
        ${thisInput.witnessScript && thisInput.redeemScript ? ' & ' : ''}
        ${thisInput.redeemScript ? ' redeem ' : ''}
        script
      `)
    }
    // Backwards also doesn't work. if input script is provided need one of the others.
    // Input script needs to input values into one of them...
    if (
      !thisInput.witnessScript &&
      !thisInput.redeemScript &&
      thisInput.inputScript
    ) {
      throw new Error(
        `Missing witness or redeem scripts but provided input script for input #${thisVin}`
      )
    }

    if (
      !thisInput.canJustSign &&
      (!thisInput.inputScript ||
        !thisInput.witnessScript ||
        !thisInput.redeemScript)
    ) {
      throw new Error(
        `Can't just sign but no spending scripts either for input #${thisVin}`
      )
    }

    if (thisInput.keyPairs) inputBuilder.keyPairs = thisInput.keyPairs
    if (
      (!thisInput.keyPairs || !thisInput.keyPairs[0]) &&
      thisInput.canJustSign
    ) {
      throw new Error(`Need 1 keypair to just sign input #${thisVin}`)
    }

    if (thisInput.sighashTypes)
      inputBuilder.sighashTypes = thisInput.sighashTypes
    if (
      thisInput.sighashTypes &&
      thisInput.keyPairs &&
      thisInput.sighashTypes.length !== thisInput.keyPairs.length
    ) {
      throw new Error(
        `Each key pair needs matching sighash choice. Missing matches on input #${thisVin}`
      )
    }

    // add it
    psbt.addInput({ ...inputBuilder })
  })
}

/* -------------------------------------------------------------------------- */
/*                                 add outputs                                */
/* -------------------------------------------------------------------------- */
const addOutputs = ({ tb, psbt }: { tb: any; psbt: any }) => {
  if (!tb.outputs || Object.keys(tb.outputs).length === 0) {
    throw new Error(`Can't have no outputs`)
  }

  // check that there's an output for each index up to max
  console.log(
    `getTx found ${Object.keys(tb.outputs).length.toFixed(0)} outputs`
  )

  for (let i = 0; i < Object.keys(tb.outputs).length; i++) {
    const thisValue = tb.outputs[i.toFixed(0)]
    if (thisValue === undefined) {
      throw new Error(`Missing output at vout index ${i.toFixed(0)}`)
    }
  }

  // add change output if change is above dust level
  if (tb.minDustValue < tb.result.changeValue) {
    const nextIndex = Object.keys(tb.outputs).length // next index
    tb.outputs[nextIndex.toFixed(0)] = {
      address: tb.changeAddress,
      value: tb.result.changeValue,
      info: 'change'
    }
  }

  Object.keys(tb.outputs).forEach((thisVout: string, i: number) => {
    // check that output key matches current index
    if (thisVout !== i.toFixed(0))
      throw new Error(`Badly labeled output with key ${thisVout}`)

    const thisNewOutput = tb.outputs[thisVout]

    // required values
    if (!thisNewOutput.value)
      throw new Error(`Missing value on output #${thisVout}`)

    const outputBuilder: any = {
      value: thisNewOutput.value
    }

    // need either address or script
    if (!thisNewOutput.address && !thisNewOutput.script) {
      throw new Error(`Missing address OR script on output #${thisVout}`)
    }
    if (thisNewOutput.address) outputBuilder.address = thisNewOutput.address
    if (thisNewOutput.script) outputBuilder.script = thisNewOutput.script

    // add it
    psbt.addOutput({ ...thisNewOutput })
  })
}

/* -------------------------------------------------------------------------- */
/*                                 sign inputs                                */
/* -------------------------------------------------------------------------- */
const signInputs = ({ tb, psbt }: { tb: any; psbt: any }) => {
  const network = bitcoin.networks[tb.network]

  const nInputs = Object.keys(tb.inputs).length

  for (let i = 0; i < nInputs; i++) {
    const input = tb.inputs[i.toFixed(0)]

    if (input.canJustSign) {
      // easy case, signs with input.keyPairs[0]
      psbt.signInput(i, input.keyPairs[0])

      if (!psbt.validateSignaturesOfInput(i)) {
        throw new Error(
          'Signature validation failed for input index ' + i.toFixed(0)
        )
      }

      psbt.finalizeInput(i)
    }

    // hard case with scripts
    // ((TODO): no signatures calc yet. Those would go into input.inputScript)
    if (!input.canJustSign) {
      psbt.finalizeInput(
        i,
        getFinalScripts({
          inputScript: input.inputScript,
          network
        })
      )
    }
  }
}

/* ----------------------------- handle scripts ----------------------------- */

/**
 * Finalize outputs that require custom scripts.
 * Based on based on
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/csv.spec.ts
 */
export const getFinalScripts = ({ inputScript, network }: any) => {
  return function (
    inputIndex: number,
    input: any,
    script: Buffer,
    isSegwit: boolean,
    isP2SH: boolean,
    isP2WSH: boolean
  ): {
    finalScriptSig: Buffer | undefined
    finalScriptWitness: Buffer | undefined
  } {
    // Step 1: Check to make sure the meaningful script matches what you expect.

    // Step 2: Create final scripts
    let payment: any = {
      network,
      output: script,
      input: inputScript
    }
    if (isP2WSH && isSegwit)
      payment = bitcoin.payments.p2wsh({
        network,
        redeem: payment
      })
    if (isP2SH)
      payment = bitcoin.payments.p2sh({
        network,
        redeem: payment
      })

    function witnessStackToScriptWitness (witness: Buffer[]): Buffer {
      let buffer = Buffer.allocUnsafe(0)

      function writeSlice (slice: Buffer): void {
        buffer = Buffer.concat([buffer, Buffer.from(slice)])
      }

      function writeVarInt (i: number): void {
        const currentLen = buffer.length
        const varintLen = varuint.encodingLength(i)

        buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)])
        varuint.encode(i, buffer, currentLen)
      }

      function writeVarSlice (slice: Buffer): void {
        writeVarInt(slice.length)
        writeSlice(slice)
      }

      function writeVector (vector: Buffer[]): void {
        writeVarInt(vector.length)
        vector.forEach(writeVarSlice)
      }

      writeVector(witness)

      return buffer
    }

    return {
      finalScriptSig: payment.input,
      finalScriptWitness:
        payment.witness && payment.witness.length > 0
          ? witnessStackToScriptWitness(payment.witness)
          : undefined
    }
  }
}
