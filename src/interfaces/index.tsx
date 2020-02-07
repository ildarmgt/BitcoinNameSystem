import {
  BNSActions,
  I_Domain,
  I_TX,
  I_UTXO
} from './../helpers/bns/types/'

/**
 * All the interfaces & enums
 */


export * from './../helpers/bns/types/'

// for global state action creators
export enum ActionTypes {
  STORE_SEARCH_RESULTS = 'STORE_SEARCH_RESULTS',
  STORE_SEARCH_RESULTS_FAIL = 'STORE_SEARCH_RESULTS_FAIL',
  TYPING = 'TYPING',
  NEW_WALLET = 'NEW_WALLET',
  CHANGE_PAGE_INFO = 'CHANGE_PAGE_INFO',
  UPDATE_WALLET = 'UPDATE_WALLET',
  UPDATE_DOMAIN = 'UPDATE_DOMAIN',
  ACTION_FAIL = 'ACTION_FAIL',
  LOAD_STATE = 'LOAD_STATE',
  CHOICES_BNS_ACTION = 'CHOICES_BNS_ACTION'
}

export type Dispatch = React.Dispatch<I_Action>

export interface I_Action {
  type: ActionTypes
  payload: any
}

export interface I_State {
  network: string
  alias: string
  extension: string
  domain: I_Domain
  wallet: {
    address: string
    mnemonic: string
    WIF: string
    txHistory:  Array<I_TX>
    utxoList: Array<I_UTXO>
  }
  chain: {
    height: number
  }
  choices: {
    action: {
      type: BNSActions
      info: string
      special: Array<any> | []
    } | {}
    feeRate: number
    txHex: string
    embedString: string
  }
  pageInfo: {
    current: number
    checkedDomain: boolean
    checkedWallet: boolean
    checkedLightSearch: boolean
  }
  lastTimeStamp: number
}
