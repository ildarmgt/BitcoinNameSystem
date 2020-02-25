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