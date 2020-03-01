import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
import { ecies } from './../../helpers/bns'

describe('ecies encrypt and decrypt', () => {
  console.time('ecies - derive nodes')

  const network = bitcoin.networks.bitcoin
  const strMnemonic =
    'grace buddy scene leisure strategy spike hair mammal vanish butter hint olive'
  const seedBuffer = bip39.mnemonicToSeed(strMnemonic)
  const masterNode = bitcoin.bip32.fromSeed(seedBuffer, network)
  const childNode_m_1001h_0h_0h = masterNode.derivePath("m/1001'/0'/0'")
  const childNode_m_1001h_0h_0h_neutered = childNode_m_1001h_0h_0h.neutered()

  console.timeEnd('ecies - derive nodes')

  const clearText = Buffer.from('This is 16 chars', 'utf8')

  const options = {
    curveName: 'secp256k1',
    symmetricCypherName: 'aes-256-ctr',
    toIv:
      'tb1q2t7tc7nta5ul6xzd7682jgstxwkap2uflrgu4s02c800a077f88a2ea6d76d43de00e08e69411dd080a60e2e2788fed6af8e40444b0'
  }

  // test basic functionality first

  console.time('ecies - encrypt')
  const encrypted = ecies.encrypt(
    childNode_m_1001h_0h_0h_neutered.publicKey,
    clearText,
    options
  )
  console.timeEnd('ecies - encrypt')

  console.time('ecies - decrypt')
  const decrypted = ecies.decrypt(
    childNode_m_1001h_0h_0h.privateKey,
    encrypted,
    options
  )
  console.timeEnd('ecies - decrypt')

  test('Encryption returned buffer', () => {
    expect(Buffer.isBuffer(encrypted)).toEqual(true)
  })

  test('Encryption result is predictable bytes size', () => {
    expect(encrypted.length).toEqual(53)
  })

  test('Decryption returned buffer', () => {
    expect(Buffer.isBuffer(decrypted)).toEqual(true)
  })

  test('Clear text was encrypted and decrypted successfully', () => {
    expect(Buffer.compare(clearText, decrypted)).toEqual(0)
  })
})
