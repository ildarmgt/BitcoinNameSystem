import { I_Bid } from './types'

// this file will be used for various functions that might need deterministic random function

/**
 * Takes array of bids or empty array and returns a winner if possible, otherwise undefined.
 * Winner is derived through deterministic weighted random number weighted by bid values.
 */
export const deterministicRandomBid = (bidArray: Array<I_Bid>): I_Bid | undefined => {
  // easy cases
  if (bidArray === undefined) return undefined
  if (bidArray.length === 0) return undefined
  if (bidArray.length === 1) return bidArray[0]

  // now the harder derivations of N > 1 elements

  // max weight summed up across all elements
  let maxRange = 0
  // array of each element including their range based on weight (value)
  let ranges = bidArray.map(thisBid => {
    const thisRange = {
      min: maxRange,
      max: maxRange + thisBid.value,
      weight: thisBid.value,
      bid: thisBid
    }
    maxRange = maxRange + thisBid.value
    return thisRange
  })

  // Ideally should use block hash at this height to get random value,
  // which is not predictable or cheap to change when block is found, even by miners.
  // Grabbing the first blockHash, same at same height (same block = same block hash).
  const blockHash = bidArray[0].blockHash

  // quickly check that all block hashes are same
  if (bidArray.some(thisBid => thisBid.blockHash !== blockHash)) {
    console.warn('bidArray should have same height txs but txs contained different block hashes!!!', bidArray)
  }

  // convert block hash to hex BigInt can read and create BigInt
  const hashBigInt = BigInt('0x' + blockHash)

  // take a mod of max range to use as random number
  const rangedHashBigInt = hashBigInt % BigInt(maxRange)

  // find the range where it landed and return that bid
  // the overall range of [0, maxRange) is split into separate ranges by each bid the exact length of each bid amount
  // a number mod of max range has to fall somewhere within the individual ranges, and decide the winner
  // completely deterministic by anyone independently yet very hard to predict before tx confirmations
  for (let i = 0; i < ranges.length; i++) {
    if (BigInt(ranges[i].min) <= rangedHashBigInt) {
      if (BigInt(ranges[i].max) < rangedHashBigInt) {
        // found it
        return ranges[i].bid
      }
    }
  }

  console.warn('something went wrong and no winner was found', ranges, bidArray, maxRange)
  return undefined
}