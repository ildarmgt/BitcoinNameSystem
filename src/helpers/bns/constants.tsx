/**
 * Constants used to determine rules on BNS.
 */

// testing mode true/false to reduce waiting time for tests
// on for `npm run start` (development mode)
// off for `npm run build` (production mode)
export const TESTING = process.env.NODE_ENV === 'development'
TESTING ? console.warn('Testing mode ON') : console.warn('Deployment mode')

// Block times can vary from 10 minutes but ok for estimate.
// Extremely different results timewise on testnet.
// blocks * 10 / 60 / 24 ~ days
// 262800 blocks ~5 years
// 52560 blocks ~365 days.
// 15000 blocks ~104 days.
// 1000 blocks ~7 days.
// 288 blocks ~48 hours.
// 144 blocks ~1 day.

// max data safe to embed in OP_RETURN type tx (bytes)
// ~80 chars
export const BYTES_MAX = 80

// Satoshis to burn minimum for attempting ownership (satoshi)
export const MIN_BURN = 1000

//  Minimum to use for notification output (satoshi)
export const MIN_NOTIFY = 1000

// Ownership duration after victory (blocks)
// ~5 years (production) / ~104 days (development)
export const OWNERSHIP_DURATION_BY_BLOCKS = !TESTING ? 262800 : 15000

// Duration before a top bidder becomes owner (blocks)
// ~1 day
export const CHALLENGE_PERIOD_DURATION_BY_BLOCKS = 144

// Multiplier required on burn amount for new bid to beat
// a previous (lower height) winning bid (assuming meets other conditions by deadline).
// sets a minimum treshhold for trying to outbid someone else
export const CHALLENGE_MIN_MULTIPLY = 2

// BNS did not really exist before this point (for notifications only, wallets can go further)
// this might be used to feed to nodes to speed up fetching of notification data to only after this height
export const EARLIEST_NOTIFICATION_HEIGHT = 1662000

console.log('CONSTANTS:', {
  TESTING,
  MIN_BURN,
  MIN_NOTIFY,
  OWNERSHIP_DURATION_BY_BLOCKS,
  BYTES_MAX,
  CHALLENGE_PERIOD_DURATION_BY_BLOCKS,
  CHALLENGE_MIN_MULTIPLY,
  EARLIEST_NOTIFICATION_HEIGHT
})
