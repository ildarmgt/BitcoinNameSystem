import * as bitcoin from 'bitcoinjs-lib'
import { calcP2WSH } from './calcP2WSH'
import { MIN_BURN, MIN_NOTIFY } from './constants'
import { encrypt } from './cryptography'
import { I_Domain } from './types/'
import { getUser } from './formathelpers'

/**
 * Creates hex of tx to bid on domain.
 * Throws error if not enough funds.
 * Leave vBytes blank, it will call itself via recursion until it derives needed size.
 * @param   {string}      stringToEmbed           - string of forwarding information to embed in tx.
 * @param   {object}      wallet                  - { WIF, address, txHistory, utxoList, ... }.
 * @param   {object}      domain                  - all domain info
 * @param   {object}      choices                 - user action and tx choices
 * @param   {string}      networkChoice           - 'testnet' or 'bitcoin' (matches bitcoinjs-lib).
 * @param   {number=}     [vBytes=0]              - size of transaction in vBytes. *
 * @returns {object}                              - { thisVirtualSize, txid, hex, valueNeeded, fee, change, burnAmount }.
 */
export const calcTx = (
  stringToEmbed: string,
  wallet: any,
  domain: I_Domain,
  choices: { action: any, feeRate: number  },
  networkChoice: string,
  vBytes: number = 0
): {
  thisVirtualSize: number
  txid: number
  hex: string
  valueNeeded: number
  fee: number
  change: number
  burnAmount: number
} => {

  // grab fee rate
  const feeRate = choices.feeRate
  // grab user object
  const user = getUser({ domain }, wallet.address)
  // grab network object
  const network = bitcoin.networks[networkChoice]

  // calculate domain notification address
  const { notificationsAddress } = calcP2WSH(domain.domainName, networkChoice)

  // calculate funds necessary for this tx, round up sat for more better than being below minimum.
  const fee = Math.ceil(vBytes * feeRate)
  const valueNeeded = MIN_BURN + MIN_NOTIFY + fee; // sat
  // gather necessary utxo to use until enough to cover costs
  let usedUtxoOfPayer: Array<any> = []
  let totalGathered = 0 // sat
  wallet.utxoList?.forEach((utxo: any) => {
    // while not enough funds
    if (totalGathered < valueNeeded) {
      usedUtxoOfPayer.push(utxo)
      totalGathered += utxo.value
    }
  })
  // if still not enough funds
  if (totalGathered < valueNeeded) {
    throw new Error('Not enough funds in all the utxo')
  }
  const change = totalGathered - valueNeeded

  // calculate keys from wallet import format key
  const keyPair = bitcoin.ECPair.fromWIF(wallet.WIF, network)
  // create Partially Signed Bitcoin Transaction object to build tx
  const psbt = new bitcoin.Psbt({ network })
  psbt.setVersion(2)    // default
  psbt.setLocktime(0)   // default

  // add all inputs (owner address must always be at index 0)
  usedUtxoOfPayer.forEach(utxo => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      sequence: 0xfffffffe,
      nonWitnessUtxo: Buffer.from(utxo.hex, 'hex') // should work for segwit and nonsegwit inputs
    })
  })

  // add inputs of all ACS UTXO from this owner or it doesn't count (TODO)


  // add the op_return output (always index 0)
  // if first time sending, nonce is '0', otherwise the last blockheight when this user has sent ANY tx to that notification address
  // TODO calculate nonce in case this owner has unspent acs utxo left at notification address
  const nonce = user.nonce.toString()
  const encryptionKey =  domain.domainName + wallet.address + nonce
  console.log('nonce used to encrypt', domain.domainName, wallet.address, nonce)
  const data = encrypt(stringToEmbed, encryptionKey)
  const embed = bitcoin.payments.embed({ data: [data] })

  // output[0]: check special tx choices for max amount required to burn from special rules
  const burnAmount = choices.action.special.reduce((maxBurn: number, list: any) => {
    console.log(maxBurn, list.rules)
    return (
      ('output0value' in list.rules) ? Math.max(maxBurn, list.rules.output0value) : maxBurn
    )
  }, 0)
  psbt.addOutput({
    script: embed.output,
    value: burnAmount,
  })
  console.log('rules say to burn ', burnAmount)

  // add notification output (always index 1)
  psbt.addOutput({
    address: notificationsAddress, // calculated from domainName provided
    value: MIN_NOTIFY
  })

  // add change output (anything is fine for index 2 or higher outputs)
  psbt.addOutput({
    address: wallet.address,
    value: change
  })

  // at this point all inputs & outputs added so ready to sign

  usedUtxoOfPayer.forEach((utxo, index) => {
    // sign p2wpkh of controlling
    psbt.signInput(index, keyPair)
    // (TODO) signing ACS inputs will need script

    if (!psbt.validateSignaturesOfInput(index)) {
      throw new Error('Signature validation failed for input index ' + index.toString())
    }
  })

  psbt.finalizeAllInputs()

  const tx = psbt.extractTransaction()
  const thisVirtualSize = tx.virtualSize()
  const txid = tx.getId()
  const hex = tx.toHex()

  if (vBytes >= thisVirtualSize) {
    // If this tx fee was calculated for a vBytes size equal to or larger than the resulting derived tx (thisVirtualSize),
    // fee should be safe by being equal to or larger than necessary at required feeRate.
    // Obviously vBytes = 0 will never give the correct fee minimum the first time through.
    console.log('virtualSize', tx.virtualSize())
    console.log('byteLength', tx.byteLength())
    console.log('getId', tx.getId())
    console.log('hex', tx.toHex())
    console.log('')
    return { thisVirtualSize, txid, hex, valueNeeded, fee, change, burnAmount }
  } else {
    // Redo this tx calculation using the virtual size we just calculated for vByte optional parameter.
    return calcTx(
      stringToEmbed, wallet, domain, choices, networkChoice, thisVirtualSize
    )
  }
}
