/**
 * Unused.
 * Returns the blockheight of last confirmed tx from the
 * fromAddress to notificationAddress within txHistory array.
 */
export const getLastMessageHeight = (fromAddress: string, notificationAddress: string, txHistory: Array<any>) => {
  // let highestFound = 0
  // txHistory.forEach(tx => {
  //   // if this tx is from the fromAddress & it has a block height
  //   if (tx.vin[0].prevout.scriptpubkey_address === fromAddress && tx.status.block_height) {
  //     const height = tx.status.block_height
  //     highestFound = Math.max(highestFound, height)
  //   }
  // })
  // console.log('nonce to use for', fromAddress, 'to', notificationAddress, 'is', highestFound)
  // return highestFound
}