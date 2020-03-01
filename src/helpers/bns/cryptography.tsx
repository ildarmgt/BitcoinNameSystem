import crypto from 'crypto'

/**
 * Encrypt - symmetric - aes-256-crt
 * @param   {string}  stringText      To be encrypted (up to 80 bytes)
 * @param   {string}  stringForKey    Derive Key from (not final Key).
 * @param   {string}  stringForIV     Derive IV from (not final IV). Defaults as stringForKey.
 * @returns {Buffer}                  Buffer to embed in tx.
 */
export const encrypt = (
  stringText: string,
  stringForKey: string,
  stringForIV: string = stringForKey
) => {
  // aes-NUMBER-TYPE
  // Must have key size matching NUMBER (in aes name) of bits (NUMBER/8 bytes)
  // Must have IV matching encryption block size, 16 bytes for AES128-to-256-range in cbc mode
  // sha256 can make 32 byte buffer out of anything and then .slice(0, N) can cut it to N bytes

  const key = crypto
    .createHash('sha256')
    .update(stringForKey)
    .digest() // 32 bytes
  const iv = crypto
    .createHash('sha256')
    .update(stringForIV)
    .digest()
    .slice(0, 16) // 16 bytes

  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)
  let encrypted = cipher.update(Buffer.from(stringText))

  encrypted = Buffer.concat([encrypted, cipher.final()])

  return encrypted
}

/**
 * Decrypt - symmetric - aes-256-crt
 * @param   {Buffer}  stringText      Buffer to be decrypted.
 * @param   {string}  stringForKey    Derive Key from (not final Key).
 * @param   {string}  stringForIV     Derive IV from (not final IV). Defaults as stringForKey.
 * @returns {Buffer}                  Buffer to utf8 embeded in tx.
 */
export const decrypt = (
  bufferCypher: Buffer,
  stringForKey: string,
  stringForIV: string = stringForKey
) => {
  const key = crypto
    .createHash('sha256')
    .update(stringForKey)
    .digest() // 32 bytes
  const iv = crypto
    .createHash('sha256')
    .update(stringForIV)
    .digest()
    .slice(0, 16) // 16 bytes

  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv)

  // first part
  let decrypted = decipher.update(bufferCypher)

  // the rest
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}
