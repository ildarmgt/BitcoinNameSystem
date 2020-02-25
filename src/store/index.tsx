import React from 'react'
import { I_State, BnsBidType } from '../interfaces'
import reducer from './reducers/Reducer'
import { initialState } from './initialState'

// Change state process:
// 1. Component calls action from src/store/actions/
// 2. Action does stuff (e.g. API calls) and dispatches results to reducer in src/store/reducer/
// 3. Reducer modifies state based on dispatched payload and type of action.

/* -------------------------------------------------------------------------- */
/*                             Global state setup                             */
/* -------------------------------------------------------------------------- */
export const Store = React.createContext<any>(initialState)
// returns object with .Provider and .Consumer
// Provider makes context available to all child components no matter how deep

// creates wrapping element for global state
export function StoreProvider ({ children }: JSX.ElementChildrenAttribute): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  // dev mode only (npm run start mode only, not built version!)
  // const TESTING = (process.env.NODE_ENV === 'development')
  // if (TESTING) {
  //   localStorage.setItem('tempstate', JSON.stringify(state))
  // }

  return (
    <Store.Provider value={{ state, dispatch }}>
      { children }
    </Store.Provider>
  )
}

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
