import * as bitcoin from 'bitcoinjs-lib'
import { calcP2WSH } from './calcP2WSH'
import { MIN_BURN, MIN_NOTIFY } from './constants'
import { encrypt } from './cryptography'
import { I_Domain, I_Action_Choice } from './types/'
import { getNonce } from './formathelpers'
import { getFinalScripts } from './bitcoin'

const hash160 = bitcoin.crypto.hash160
const op = bitcoin.opcodes

interface I_Tx_Result {
  thisVirtualSize: number
  txid: number
  hex: string
  valueNeeded: number
  fee: number
  change: number
  burnAmount: number
  notifyAmount: number
  totalGathered: number
  gatheredFromWallet: number
  gatheredFromOther: number
  nInputs: number
  nOutputs: number
  nInputsFromWallet: number
  nInputsFromOther: number
}

/**
 * Creates hex of tx to bid on domain.
 * Throws error if not enough funds.
 * Leave vBytes blank, it will call itself via recursion until it derives needed size.
 * @param   {object}      wallet                  - { WIF, address, txHistory, utxoList, ... }.
 * @param   {object}      domain                  - all domain info
 * @param   {object}      choices                 - { action, feeRate, embedString, ... }
 * @param   {string}      networkChoice           - 'testnet' or 'bitcoin' (matches bitcoinjs-lib).
 * @param   {number=}     [vBytes=0]              - size of transaction in vBytes. *
 * @returns {object}                              - Tx Results.
 */
export const calcTx = (
  wallet: any,
  domain: I_Domain,
  choices: { action: I_Action_Choice, feeRate: number, embedString: string, [key: string]: any },
  networkChoice: string,
  vBytes: number = 0
): I_Tx_Result => {

  if (wallet.utxoList.length === 0) {
    throw new Error('Wallet has no funds (utxo) to use')
  }

  // grab fee rate
  const feeRate = choices.feeRate

  // grab network object
  const network = bitcoin.networks[networkChoice]

  // calculate domain notification address
  const { notificationsAddress } = calcP2WSH(domain.domainName, networkChoice)

  // calculate funds necessary for this tx, round up sat for more better than being below minimum.
  const fee = Math.ceil(vBytes * feeRate)
  const valueNeeded = MIN_BURN + MIN_NOTIFY + fee; // sat

  // gather necessary utxo to use until enough to cover costs
  let totalGathered = 0 // sat

  // track multiple sources for providing detailed information
  let gatheredFromWallet = 0
  let gatheredFromOther = 0

  // prepare extra inputs from other rules
  // adding these first to totalGathered satoshi since have to add them all anyway
  const isACSRequired = choices.action.special.some(list =>
    list.rules.inputs && (list.rules.inputs === 'NO_USER_NOTIFICATION_UTXO')
  )
  isACSRequired && console.log('spending user\'s previous acs utxo appears required')
  let toBeUsedUtxoOfNotifications: Array<any> = []
  if (isACSRequired) {
    // must consume all ACS utxo wallet.address has created
    // get all utxo for notification address
    domain.derivedUtxoList.forEach(utxo => {
      // use only utxo created from this wallet's address
      if (utxo.from_scriptpubkey_address === wallet.address) {
        toBeUsedUtxoOfNotifications.push(utxo)
        totalGathered += utxo.value
        gatheredFromOther += utxo.value
      }
    })
  }

  // Adding remaining funds from user's wallet to total Gathered
  // Must always add at least 1 user utxo @ index 0 to indicate ownership
  let toBeUsedUtxoOfUserWallet: Array<any> = []
  wallet.utxoList.forEach((utxo: any) => {
    // while not enough funds or if haven't added a single user utxo yet
    if (totalGathered < valueNeeded || toBeUsedUtxoOfUserWallet.length === 0) {
      toBeUsedUtxoOfUserWallet.push(utxo)
      totalGathered += utxo.value
      gatheredFromWallet += utxo.value
    }
  })

  // all utxo parsed at this point

  // if still not enough funds after all possible inputs,
  // there are simply not enough funds to do the tx
  if (totalGathered < valueNeeded) {
    throw new Error('Not enough funds available (' + (valueNeeded / 1e8).toFixed(8) + ' BTC)')
  }


  // calculate keys from wallet import format key
  const keyPair = bitcoin.ECPair.fromWIF(wallet.WIF, network)
  // create Partially Signed Bitcoin Transaction object to build tx
  const psbt = new bitcoin.Psbt({ network })
  psbt.setVersion(2)    // default
  psbt.setLocktime(0)   // default

  // add all inputs to transaction

  // must be first added as owner address must always be at index 0 input
  toBeUsedUtxoOfUserWallet.forEach(utxo => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      sequence: 0xfffffffe,
      // should work for segwit and nonsegwit inputs
      nonWitnessUtxo: Buffer.from(utxo.hex, 'hex')
    })
  })

  // calculate witnessScript
  const witnessScript = bitcoin.script.compile([
    hash160(Buffer.from(domain.domainName, 'utf8')),
    op.OP_DROP
  ])

  const inputScript = bitcoin.script.compile([op.OP_TRUE])

  if (isACSRequired) {

    // add each utxo to inputs
    toBeUsedUtxoOfNotifications.forEach(utxo => {
      if (!utxo.hex) {
        // abort if missing raw hex
        throw new Error(`Utxo is missing hex, txid: ${utxo.txid}, vout:${utxo.vout}`)
      }
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffe,
        nonWitnessUtxo: Buffer.from(utxo.hex, 'hex'),
        witnessScript: witnessScript
      })
    })
  }

  // inputs done

  // outputs now

  // add the op_return output (always index 0)
  // if first time sending, nonce is '0', otherwise the last blockheight when this user has sent ANY tx to that notification address
  // TODO calculate nonce in case this owner has unspent acs utxo left at notification address
  const nonce = getNonce({ domain }, wallet.address).toString()
  const encryptionKey =  domain.domainName + wallet.address + nonce
  console.log('nonce used to encrypt', domain.domainName, wallet.address, nonce)
  // if there's extra content add it, otherwise just regular string
  const finalEmbedString = choices.action.actionContent !== ''
    ? [choices.action.actionContent, choices.embedString].join(' ')
    : choices.embedString
  console.log('string embedded is', finalEmbedString)

  const data = encrypt(finalEmbedString, encryptionKey)
  const embed = bitcoin.payments.embed({ data: [data] })

  // output[0]: check special tx rules for max amount required to burn among all of them
  const burnAmount = choices.action.special.reduce((maxBurn: number, list: any) => {
    console.log('choices.action.special each item:', list)
    return (
      // if there's another burn rule, use the highest value
      ('output0value' in list.rules)
        ? Math.max(maxBurn, list.rules.output0value)
        : maxBurn
    )
  }, 0)
  psbt.addOutput({
    script: embed.output,
    value: burnAmount,
  })
  console.log('rules say to burn ', burnAmount)

  // output[1] add notification output (always index 1)
  psbt.addOutput({
    address: notificationsAddress, // calculated from domainName provided
    value: MIN_NOTIFY
  })

  // output[2] add change output (anything is fine for output[2] or higher)
  const changeAddress = choices.action.type === 'CHANGE_ADDRESS'
    ? choices.action.actionContent.split(' ')[1] // new address
    : wallet.address
  const change = totalGathered - valueNeeded
  psbt.addOutput({
    address: changeAddress,
    value: change
  })

  // at this point all inputs & outputs added so ready to sign

  toBeUsedUtxoOfUserWallet.forEach((utxo, index) => {
    // sign p2wpkh of controlling
    psbt.signInput(index, keyPair)
    // (TODO) signing ACS inputs will need script

    if (!psbt.validateSignaturesOfInput(index)) {
      throw new Error('Signature validation failed for input index ' + index.toString())
    }
  })

  // finalizing inputs
  // psbt.finalizeAllInputs()

  // finalize regular p2wsh inputs normally
  for (let i = 0; i < toBeUsedUtxoOfUserWallet.length; i++) {
    psbt.finalizeInput(i)
  }
  // finalize witness script stack inputs with extra parameter
  // for the submitted script parameters & original full script
  for (
    let i = toBeUsedUtxoOfUserWallet.length;
    i < toBeUsedUtxoOfUserWallet.length + toBeUsedUtxoOfNotifications.length;
    i++
  ) {
    psbt.finalizeInput(i, getFinalScripts({ inputScript, network }))
  }

  const tx = psbt.extractTransaction()
  console.log(tx)
  const thisVirtualSize = tx.virtualSize()
  const txid = tx.getId()
  const hex = tx.toHex()
  const nInputs = tx.ins.length
  const nOutputs = tx.outs.length

  if (vBytes >= thisVirtualSize) {
    // If this tx fee was calculated for a vBytes size equal to or larger than the resulting derived tx (thisVirtualSize),
    // fee should be safe by being equal to or larger than necessary at required feeRate.
    // Obviously vBytes = 0 will never give the correct fee minimum the first time through.
    console.log('virtualSize', tx.virtualSize())
    console.log('byteLength', tx.byteLength())
    console.log('getId', tx.getId())
    console.log('hex', tx.toHex())
    console.log('')
    return {
      txid,
      thisVirtualSize,
      hex, valueNeeded,
      fee,
      change,
      burnAmount,
      notifyAmount: MIN_NOTIFY,
      totalGathered,
      gatheredFromWallet,
      gatheredFromOther,
      nInputs,
      nOutputs,
      nInputsFromWallet: toBeUsedUtxoOfUserWallet.length,
      nInputsFromOther: toBeUsedUtxoOfNotifications.length || 0
    }
  } else {
    // Redo this tx calculation using the virtual size we just calculated for vByte optional parameter.
    return calcTx(
      wallet, domain, choices, networkChoice, thisVirtualSize
    )
  }
}



