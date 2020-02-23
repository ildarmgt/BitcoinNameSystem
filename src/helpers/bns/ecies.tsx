// My edit of https://github.com/bin-y/standard-ecies/blob/master/main.js
// Remove space consuming hmac, replaced with 4 byte checksum, simplified
// https://medium.com/asecuritysite-when-bob-met-alice/go-public-and-symmetric-key-the-best-of-both-worlds-ecies-180f71eebf59
// https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme

import crypto from 'crypto'

// ecies.encrypt() or ecies.decrypt()

interface I_Options {
  hashName?: string                                       // 'sha256' (default)
  curveName?: string                                      // e.g. 'secp256k1' (default)
  symmetricCypherName?: string                            // e.g. 'aes-256-crt' or 'aes-256-ecb' (default)
  iv?: Buffer | null                                      // 16 byte buffer or null
  toIv?: Buffer | string                                  // will get hashed to derive iv
  keyFormat?: "compressed" | "uncompressed" | "hybrid"    // e.g. 'compressed' (default)
}

/**
 * Attempts to encrypt with public key.
 * For 'secp256k1' 33 bytes on ephemeral key, 4 bytes checksum, rest on cipher content.
 * Returns encrypted message buffer or undefined if error.
 * @param     {Buffer}      publicKey           Public key to encrypt with.
 * @param     {Buffer}      message             Clear text message to decrypt.
 * @param     {object}      [options={}]        Object with options.
 * @returns   {Buffer | undefined}              Encrypted message buffer, undefined if error.
 */
const encrypt = (publicKey: Buffer, message: Buffer, options: I_Options = {}) => {
  options = makeUpOptions(options)

  try {
    // add 4 byte checksum to end of cleartext to check later
    const checkSum = crypto.createHash('sha256').update(message).digest().slice(0, 4)
    const checkSummedMessage = Buffer.concat([message, checkSum])

    const ecdh = crypto.createECDH(options.curveName!)
    // R (generated)
    // null error avoided via hex buffer
    const R = Buffer.from(ecdh.generateKeys('hex', options.keyFormat!), 'hex')
    // S (calculated)
    const sharedSecret = ecdh.computeSecret(publicKey)

    // uses KDF to derive a symmetric encryption
    // Ke = KDF(S)
    const hash = hashMessage(options.hashName!, sharedSecret)
    // Ke
    const encryptionKey = hash

    // encrypts the message:
    // c = E(Ke m)
    const cipherText = symmetricEncrypt(options.symmetricCypherName!, options.iv, encryptionKey, checkSummedMessage)

    // console.log('ecies encryption success with', { R, cipherText })

    // outputs R || c
    return Buffer.concat([R, cipherText])

  } catch (e) {
    return undefined
  }
}

/**
 * Attempts to decrypt with private key.
 * Returns decrypted message buffer or undefined if error or checksum fail.
 * @param     {Buffer}      privateKey          Private key to decrypt with.
 * @param     {Buffer}      encryptedMessage    Encrypted message to decrypt.
 * @param     {object}      [options={}]        Object with options.
 * @returns   {Buffer | undefined}              Cleartext if decrypted, otherwise undefined.
 */
const decrypt = (privateKey: Buffer, encryptedMessage: Buffer, options: I_Options = {}) => {
  options = makeUpOptions(options)

  const ecdh = crypto.createECDH(options.curveName!)
  ecdh.setPrivateKey(privateKey);

  try {
    // null error avoided via hex buffer
    const publicKeyLength = Buffer.from(ecdh.getPublicKey('hex', options.keyFormat), 'hex').length
    // R (provided)
    const R = encryptedMessage.slice(0, publicKeyLength)
    // c (provided)
    const cipherText = encryptedMessage.slice(publicKeyLength, encryptedMessage.length)
    // S (calculated)
    const sharedSecret = ecdh.computeSecret(R)

    // derives keys the same way as Alice did:
    // Ke = KDF(S)
    const hash = hashMessage(options.hashName!, sharedSecret)
    // Ke
    const encryptionKey = hash

    // console.log({ R, cipherText })
    const decryptedMessagecheckSummed = symmetricDecrypt(options.symmetricCypherName!, options.iv, encryptionKey, cipherText)

    // check the last 4 bytes of checksum
    const checkSum = decryptedMessagecheckSummed.slice(-4)
    const decryptedMessage = decryptedMessagecheckSummed.slice(0, -4)
    const newCheckSum = crypto.createHash('sha256').update(decryptedMessage).digest().slice(0, 4)

    // if not equal or either are too short
    if (Buffer.compare(checkSum, newCheckSum) !== 0 || checkSum.length !== 4 || newCheckSum.length !== 4) {
      throw new Error('checkSum failed')
    }

    // console.log('ecies decryption success from', { R, cipherText })
    return decryptedMessage

  } catch (e) {

    return undefined
  }
}

export const ecies = { encrypt, decrypt }

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

// E
function symmetricEncrypt(cypherName: string, iv: Buffer | null | undefined, key: Buffer, plaintext: Buffer) {
  let cipher
  if (iv) {
    cipher = crypto.createCipheriv(cypherName, key, iv)
  }
  else {
    cipher = crypto.createCipher(cypherName, key)
  }
  const firstChunk = cipher.update(plaintext)
  const secondChunk = cipher.final()
  return Buffer.concat([firstChunk, secondChunk])
}

// E-1
function symmetricDecrypt(cypherName: string, iv: Buffer | null | undefined, key: Buffer, ciphertext: Buffer) {
  let cipher
  if (iv) {
    cipher = crypto.createDecipheriv(cypherName, key, iv)
  }
  else {
    cipher = crypto.createDecipher(cypherName, key)

  }
  const firstChunk = cipher.update(ciphertext)
  const secondChunk = cipher.final()
  return Buffer.concat([firstChunk, secondChunk])
}

// KDF
function hashMessage(cypherName: string, message: Buffer) {
  return crypto.createHash(cypherName).update(message).digest()
}

function makeUpOptions(options: I_Options = {}) {

  if (options.hashName === undefined) {
    options.hashName = 'sha256'
  }
  if (options.curveName === undefined) {
    options.curveName = 'secp256k1'
  }
  if (options.symmetricCypherName === undefined) {
    options.symmetricCypherName = 'aes-256-ecb'
    options.iv = null
  }
  if (options.iv === undefined && options.toIv) {
    options.iv = crypto.createHash('sha256')
      .update(options.toIv)     // value to hash
      .digest()                 // hash
      .slice(0, 16)             // first 16 bytes
  }
  if (options.keyFormat === undefined) {
    options.keyFormat = 'compressed'
  }

  return options
}

