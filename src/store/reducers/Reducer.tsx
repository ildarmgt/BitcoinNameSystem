import { I_State, I_Action, ActionTypes } from '../../interfaces'
import { initialState } from './../'
const {
  STORE_SEARCH_RESULTS_FAIL,
  STORE_SEARCH_RESULTS,
  TYPING,
  NEW_WALLET,
  CHANGE_PAGE_INFO,
  UPDATE_WALLET,
  UPDATE_DOMAIN,
  ACTION_FAIL,
  LOAD_STATE,
  CHOICES_BNS_ACTION
} = ActionTypes

/**
 * Reducer edits global state via information in payload.
 * Action is object { payload, type }.
 * type describes what type of changes to global state to make.
 * payload contains data provided to make those changes.
 */
export default function reducer (state: I_State, action: I_Action): I_State {
  const { payload } = action

  switch (action.type) {

    case CHOICES_BNS_ACTION: {
      // BNS action chosen
      return {
        ...state,
        choices: {
          ...state.choices,
          ...payload
        },
        lastTimeStamp: Date.now()
      }
    }

    case UPDATE_WALLET: {
      // after full scan of the wallet address
      return {
        ...state,
        wallet: {
          ...state.wallet, // wif/mnemonic/address unchanged
          txHistory: payload.wallet.txHistory,
          utxoList: payload.wallet.utxoList
        },
        pageInfo: {
          ...state.pageInfo,
          checkedWallet: true
        },
        lastTimeStamp: Date.now()
      }
    }

    case UPDATE_DOMAIN: {
      return {
        ...state,
        domain: {
          ...payload.domain
        },
        chain: {
          height: payload.chain.height
        },
        pageInfo: {
          ...state.pageInfo,
          checkedDomain: true
        },
        lastTimeStamp: Date.now()
      }
    }

    case CHANGE_PAGE_INFO:
      // navigation info for controlling domains
      return {
        ...state,
        pageInfo: {
          ...state.pageInfo,
          current: payload
        }
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
        pageInfo: {
          ...state.pageInfo,
          checkedWallet: false
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
        domain: {
          ...initialState.domain,
          ...payload.domain
        },
        chain: {
          height: payload.chain.height
        },
        pageInfo: {
          ...state.pageInfo,
          checkedDomain: true
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
        domain: {
          ...initialState.domain,
          domainName: payload.domainName,
          notificationAddress: payload.notificationAddress
        },
        pageInfo: {
          ...state.pageInfo,
          checkedDomain: false
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
        domain: initialState.domain,
        pageInfo: {
          ...state.pageInfo,
          current: 1,
          checkedDomain: false
        },
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

