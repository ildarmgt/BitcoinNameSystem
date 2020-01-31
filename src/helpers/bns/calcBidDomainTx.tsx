import * as bitcoin from 'bitcoinjs-lib'
import { calcP2WSH } from './calcP2WSH'
import { MIN_BURN, MIN_NOTIFY } from './constants'
import { encrypt } from './cryptography'
import { getLastMessageHeight } from './getLastMessageHeight'

/**
 * Creates hex of tx to bid on domain.
 * Throws error if not enough funds.
 * Leave vBytes blank, it will call itself via recursion until it derives needed size.
 * @param   {string}      stringToEmbed           - string of forwarding information to embed in tx.
 * @param   {object}      wallet                  - { WIF, address, txHistory, utxoList, ... }.
 * @param   {string}      domainName              - full domainName to use (e.g. 'satoshi.btc').
 * @param   {number}      feeRate                 - fee rate in satoshi/vBytes.
 * @param   {Array}       notificationTxHistory   - Array of transactions to notification address.
 * @param   {string}      networkChoice           - 'testnet' or 'bitcoin' (matches bitcoinjs-lib).
 * @param   {number=}     [vBytes=0]              - size of transaction in vBytes. *
 * @returns {object}                              - { thisVirtualSize, txid, hex, valueNeeded, fee, change }.
 */
export const calcBidDomainTx = (
  stringToEmbed: string,
  wallet: any,
  domainName: string,
  feeRate: number,
  notificationTxHistory: Array<any>,
  networkChoice: string,
  vBytes: number = 0
): any => {

  const network = bitcoin.networks[networkChoice]
  const { notificationsAddress } = calcP2WSH(domainName, networkChoice)

  // calculate funds necessary for this tx, more than needed better than less.
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

  // if first time sending, nonce is '0', otherwise the last blockheight when notification was sent from this owner address
  // TODO calculate nonce in case this owner has unspent acs utxo left at notification address
  const nonce = getLastMessageHeight(wallet.address, notificationsAddress, notificationTxHistory)
  const encryptionKey =  domainName + wallet.address + nonce.toString()
  const data = encrypt(stringToEmbed,encryptionKey)
  const embed = bitcoin.payments.embed({ data: [data] })
  psbt.addOutput({
    script: embed.output,
    value: MIN_BURN,
  })

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
    return { thisVirtualSize, txid, hex, valueNeeded, fee, change }
  } else {
    // Redo this tx calculation using the virtual size we just calculated for vByte optional parameter.
    return calcBidDomainTx(stringToEmbed, wallet, domainName, feeRate, notificationTxHistory, networkChoice, thisVirtualSize)
  }
}
