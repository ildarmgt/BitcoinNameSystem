import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
import bs58check from 'bs58check'

/**
 * Returns xpub base58check from seed mnemonic and last hardened index.
 * @param     {Buffer}      mnemonic            Mnemonic.
 * @param     {Buffer}      message             Hardened index to use.
 * @returns   {Buffer}                          xpub Buffer
 */
export const getStealthAddress = (
  mnemonic: string,
  networkName = 'bitcoin',
  index = 0
) => {
  // pick testnet or bitcoin
  const network = bitcoin.networks[networkName]
  // create seed
  const seedBuffer = bip39.mnemonicToSeed(mnemonic)
  // create masterNode for HD wallet
  const masterNode = bitcoin.bip32.fromSeed(seedBuffer, network)
  // derive the path used, e.g. m/1001'/0'/0'
  const childNode_m_1001h_0h_indexh = masterNode.derivePath(
    `m/1001'/0'/${index}'`
  )
  // make xpriv into xpub, no private keys
  const childNode_m_1001h_0h_0h_neutered = childNode_m_1001h_0h_indexh.neutered()
  // from js object to base58check
  const xPub_B58 = childNode_m_1001h_0h_0h_neutered.toBase58()

  // convert to byte data buffer from base58check
  const xPub_Buffer = bs58check.decode(xPub_B58)
  console.log('xpub bytes:', xPub_Buffer.length)

  // return b58 string & byte format
  return xPub_Buffer
}
