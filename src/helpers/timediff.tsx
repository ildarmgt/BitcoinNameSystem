/**
 * Difference between timestampMsec timestamp relative to current time or another reference referenceTimestampMsec timestamp.
 * Returns days-hours-minutes string, days-hours string, if expired, and ms of difference.
 * @param   {number}  timestampMsec               Timestamp of interest (milliseconds).
 * @param   {number}  [referenceTimestampMsec=]   Reference timestamp (milliseconds).
 * @returns {object}                              { dhm, dh, isExpired, msDiff, ... }.
 */
export default function timeDiff (
  timestampMsec: number,
  referenceTimestampMsec: number = Date.now()
): {
  dhm: string
  dh: string
  isExpired: boolean
  msDiff: number
  timestampMsec: number
  referenceTimestampMsec: number
} {
  let diff = Math.abs(timestampMsec - referenceTimestampMsec)
  // note sign
  const isExpired = diff <= 0
  // mod away higher time frames
  diff = Math.abs(diff)
  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  // remove days
  diff -= d * (1000 * 60 * 60 * 24)
  const h = Math.floor(diff / (1000 * 60 * 60)) % 24
  // remove hours
  diff -= h * (1000 * 60 * 60)
  const m = Math.floor(diff / (1000 * 60)) % 60
  return {
    dhm: `${d} days ${h} hours ${m} min`,
    dh: `${d} days ${h} hours`,
    isExpired, // time difference is to the past of now? (boolean)
    msDiff: diff,
    timestampMsec,
    referenceTimestampMsec
  }
}
