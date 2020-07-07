import { I_State, BnsBidType } from '../interfaces'

/* -------------------------------------------------------------------------- */
/*                         Helper functions for state                         */
/* -------------------------------------------------------------------------- */

/**
 * get owner based on state, or undefined
 */
export const getOwner = (st: I_State) => {
  const ownerAddress = st.domain.currentOwner
  return st.domain.users[ownerAddress]
}

/**
 * Undefined if no user, otherwise existing user.
 */
export const getUser = (st: I_State, address: string) => {
  return st.domain.users[address]
}

/**
 * Get if bidding for ownership period is happening and bidding object.
 */
export const getBidding = (st: I_State) => {
  const bidding = st.domain.bidding
  return {
    isBurn: bidding.type === BnsBidType.BURN,
    bidding
  }
}

// show BTC balance with styling and proper units based on network
export const unitsBTC = (st: I_State) =>
  st.network === 'testnet' ? 'tBTC' : 'BTC'

export const satsToBTC = (sats: number): string => (sats / 1e8).toFixed(8)

// easier visually to count satoshi via spaces
// 123.8765 4321
export const satsToBTCSpaced = (sats: number): string => {
  let styling = (sats / 1e8).toFixed(8).split('')

  // insert space 4 chars from end
  styling = [...styling.slice(0, -4), '\xa0', ...styling.slice(-4)]

  // styling = [...styling.slice(0, -2), '\xa0', ...styling.slice(-2)]

  return styling.join('')
}

export const getUnspentSum = (utxoArray: Array<any>): number => {
  const sumSats =
    utxoArray?.reduce((sum: number, utxo: any) => sum + utxo.value, 0) || 0

  return sumSats
}
