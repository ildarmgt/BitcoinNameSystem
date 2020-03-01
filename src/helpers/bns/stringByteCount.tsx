import { encrypt } from './cryptography'

/**
 * Returns number of bytes the string has after encryption.
 * Encryption is used directly to measure result accurately
 * even if cryption method changes in the future.
 */
export const stringByteCount = (data: string): number => {
  const cipher: Buffer = encrypt(data, 'arbitrary key and iv seeding string')
  // returns buffer, so length should be bytesize
  return cipher.length
}
