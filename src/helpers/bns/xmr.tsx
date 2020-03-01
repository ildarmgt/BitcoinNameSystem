import { cnBase58 as b58 } from '@xmr-core/xmr-b58'
// to keep these conversions optional, should wrap encoding type (after ! symbol in network)
// interpreters in a try statement that are allowed to fail in which case
// it can display data in hex format and let users deal themselves with their custom encoding

/**
 * Decodes XMR address in base58 encoding used on XMR platform, different from Bitcoin's.
 * @param   {string}    strAddress    String of XMR address encoded in XMR version of base58.
 * @returns {Buffer}                  Buffer byte data after decoding.
 */
export const decodeBase58xmr = (strAddress: string) => {
  // using xmr library for this that takes base58xmr and returns hex
  // first we get the hex of data
  const hexData = b58.decode(strAddress)
  // then convert hex to binary data in buffer we can embed into tx
  const bufferData = Buffer.from(hexData, 'hex')
  return bufferData
}

/**
 * Encodes binary Buffer data into XMR address in base58 xmr style encoding.
 * @param   {Buffer}    bufferAddress     Buffer byte data of address.
 * @returns {string}                      String of XMR address encoded in XMR version of base58.
 */
export const encodeBase58xmr = (bufferAddress: Buffer) => {
  // using xmr library for this that takes hex and returns base58xmr
  // so first we convert binary buffer into hex
  const hexData = bufferAddress.toString('hex')
  // convert hex to binary data in buffer we can embed into tx
  const base58Data = b58.encode(hexData)
  return base58Data
}
