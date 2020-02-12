/**
 * Constants used to determine rules on BNS.
 */

// testing mode true/false to reduce waiting time for tests
// on for `npm run start` (development mode)
// off for `npm run build` (production mode)
const TESTING = (process.env.NODE_ENV === 'development')
TESTING && console.warn('Testing mode ON')

// Block times can vary from 10 minutes but ok for estimate.
// 52560 blocks ~365 days.
// 1000 blocks ~ a week.
// 288 blocks ~48 hours.
// 144 blocks ~1 day.

// max data safe to embed in OP_RETURN type tx (bytes)
// ~80 chars
const BYTES_MAX = 80

// Satoshis to burn minimum for attempting ownership (satoshi)
const MIN_BURN = 1000

//  Minimum to use for notification output (satoshi)
const MIN_NOTIFY  = 1000

// Ownership duration after victory (blocks)
// ~1 year (production) / ~7 days (development)
const OWNERSHIP_DURATION_BY_BLOCKS = !TESTING ? 52560 : 1000

// Duration before a top bidder becomes owner (blocks)
// ~1 day
const CHALLENGE_PERIOD_DURATION_BY_BLOCKS = 144


export {
  TESTING,
  MIN_BURN,
  MIN_NOTIFY,
  OWNERSHIP_DURATION_BY_BLOCKS,
  BYTES_MAX,
  CHALLENGE_PERIOD_DURATION_BY_BLOCKS
}