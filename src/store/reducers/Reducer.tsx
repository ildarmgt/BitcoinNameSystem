import { IState, IAction, ActionTypes } from '../../interfaces'
import { initialState } from './../'
const {
  STORE_SEARCH_RESULTS_FAIL,
  STORE_SEARCH_RESULTS,
  TYPING,
  NEW_WALLET,
  CHANGE_PAGE_INFO,
  UPDATE_WALLET,
  UPDATE_NOTIFICATION_ADDRESS,
  ACTION_FAIL,
  LOAD_STATE
} = ActionTypes

/**
 * Reducer edits global state via information in payload.
 * Action is object { payload, type }.
 * type describes what type of changes to global state to make.
 * payload contains data provided to make those changes.
 */
export default function reducer (state: IState, action: IAction): IState {
  const { payload } = action

  switch (action.type) {

    case UPDATE_WALLET: {
      // after full scan of the wallet address
      return {
        ...state,
        wallet: {
          ...state.wallet, // wif/mnemonic/address unchanged
          txHistory: payload.wallet.txHistory,
          utxoList: payload.wallet.utxoList,
          checkedHistory: true,
          checkedUtxo: true
        },
        lastTimeStamp: Date.now()
      }
    }

    case UPDATE_NOTIFICATION_ADDRESS: {
      return {
        ...state,
        notifications: {
          address: payload.notifications.address,
          txHistory: payload.notifications.txHistory,
          utxoList: payload.notifications.utxoList,
          checkedHistory: true,
          checkedUtxo: true
        },
        ownership: {
          ...payload.ownership,
          checked: true
        },
        chain: {
          height: payload.chain.height
        },
        lastTimeStamp: Date.now()
      }
    }

    case CHANGE_PAGE_INFO:
      // navigation info for controlling domains
      return {
        ...state,
        pageInfo: payload
      }

    case NEW_WALLET: {
      // store totally new wallet object
      return {
        ...state,
        wallet: {
          ...initialState.wallet,
          address: payload.address,
          mnemonic: payload.mnemonic,
          WIF: payload.WIF
        },
        lastTimeStamp: Date.now()
      }
    }

    case STORE_SEARCH_RESULTS: {
      // store results of looking up totally new alias
      // update notifications and ownership information
      return {
        ...state,
        alias: payload.alias,
        notifications: {
          ...initialState.notifications,
          ...payload.notifications,
          checkedHistory: true
        },
        ownership: {
          ...initialState.ownership,
          ...payload.ownership,
          checked: true
        },
        chain: {
          height: payload.chain.height
        },
        lastTimeStamp: Date.now()
      }
    }

    case STORE_SEARCH_RESULTS_FAIL: {
      // store results of looking up totally new alias
      // reset notifications and ownership information
      return {
        ...state,
        alias: payload.alias,
        notifications: {
          ...initialState.notifications,
          address: payload.notificationAddress
        },
        ownership: {
          ...initialState.ownership
        },
        lastTimeStamp: Date.now()
      }
    }

    case TYPING: {
      // change of alias part of domain name
      // this change renders owner and notification information outdated
      return {
        ...state,
        alias: payload,
        notifications: initialState.notifications,
        ownership: initialState.ownership,
        lastTimeStamp: Date.now()
      }
    }

    case ACTION_FAIL: {
      return {
        ...state,
        lastTimeStamp: Date.now()
      }
    }

    case LOAD_STATE: {
      return {
        ...payload,
        lastTimeStamp: Date.now()
      }
    }

    default: {
      console.warn('Unknown action type')
      return state
    }
  }
}

// can split maybe like this later if gets too long
// https://dev.to/vanderleisilva/global-state-management-with-react-hooks-and-context-5f6h

