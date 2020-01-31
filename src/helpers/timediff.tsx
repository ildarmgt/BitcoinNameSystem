
/**
 * Returns strings of time between inTimeStampS in seconds after blocksDuration number of blocks (assuming 10 minutes ea) and current time.
 */
export default function timeDiff (inTimeStampS: number, blocksDuration: number) {
  // N of blocks to ms, approximation
  const blocksTime = blocksDuration * 10 * 60 * 1000
  // Time left until expiration of ownership, approximation
  let diff = (inTimeStampS * 1000) + blocksTime - Date.now()
  // write down ms of it
  const msDifference = diff
  // note sign
  const expired = (diff <= 0)
  // mod away higher time frames
  diff = Math.abs(diff)
  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  diff -= d * (1000 * 60 * 60 * 24) // remove days
  const h = Math.floor(diff / (1000 * 60 * 60)) % 24
  diff -= h * (1000 * 60 * 60) // remove hours
  const m = Math.floor(diff / (1000 * 60)) % 60
  return {
    dhm: `${d} days ${h} hours ${m} min`,
    dh: `${d} days ${h} hours`,
    expired,
    msDifference
  };
}