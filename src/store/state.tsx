import React from 'react'
import reducer from './reducers/Reducer'
import { initialState } from './initialState'

/* -------------------------------------------------------------------------- */
/*                            Change state process                            */
/* -------------------------------------------------------------------------- */

// 1. Component calls action from src/store/actions/
// 2. Action does stuff (e.g. API calls) and dispatches results to reducer in src/store/reducer/
// 3. Reducer modifies state based on dispatched payload and type of action.

/* -------------------------------------------------------------------------- */
/*                             Global state setup                             */
/* -------------------------------------------------------------------------- */

// returns object with .Provider and .Consumer
// Provider makes context available to all child components no matter how deep
export const Store = React.createContext<any>(initialState)

// creates wrapping element for global state
export function StoreProvider ({
  children
}: JSX.ElementChildrenAttribute): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  // dev mode only (npm run start mode only, not built version!)
  // const TESTING = (process.env.NODE_ENV === 'development')
  // if (TESTING) {
  //   localStorage.setItem('tempstate', JSON.stringify(state))
  // }

  return <Store.Provider value={{ state, dispatch }}>{children}</Store.Provider>
}
