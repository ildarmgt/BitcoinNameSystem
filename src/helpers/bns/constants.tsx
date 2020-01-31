/**
 * Constants used to determine rules on BNS
 */

const TESTING = true                        // testing mode true/false to reduce waiting time for tests
TESTING && console.warn('Testing mode ON')

const MIN_BURN = 1000                       // Satoshis to burn minimum for ownership
const MIN_NOTIFY  = 1000                    //  Minimum to use for notification output

const OWNERSHIP_DURATION_BY_BLOCKS = !TESTING ? 52560 : 1000
// ^ (real) 52560 blocks ~365 days. (testing) 288 blocks ~48 hours. Block times can vary from 10 minutes.
// const CHALLENGE_PERIOD_DURATION_BY_BLOCKS = 3456
// ^ ~24 hours. Only matters if someone is monitoring specific domainName, otherwise they won't know what domainName the bids are for.

export {
  TESTING,
  MIN_BURN,
  MIN_NOTIFY,
  OWNERSHIP_DURATION_BY_BLOCKS
}