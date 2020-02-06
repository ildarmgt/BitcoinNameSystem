import { BNSActions } from './../helpers/bns/types/'
/**
 * All the interfaces & enums
 */

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

export type Dispatch = React.Dispatch<IAction>

export interface IAction {
  type: ActionTypes
  payload: any
}

export interface Iforward {
  network: string
  address: string
  updateHeight: number
  updateTimestamp: number
}

export interface IUser {
  address:      string
  forwards:     Array<Iforward>
  burnAmount:   number
  winHeight:    number
  winTimestamp: number
  nonce:        number
  updateHeight: number
}

export interface IState {
  network: string
  alias: string
  extension: string
  domain: {
    domainName: string
    notificationAddress: string
    txHistory: Array<any>
    utxoList: Array<any>
    users: {
      [key: string]: IUser
    }
    currentOwner: string
    bidding: {}
    checkedHistory: boolean
    checkedUtxo: boolean
  }
  wallet: {
    address: string
    mnemonic: string
    WIF: string
    txHistory: Array<any>
    utxoList: Array<any>
    checkedHistory: boolean
    checkedUtxo: boolean
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
  }
  pageInfo: {
    current: number
  }
  lastTimeStamp: number
}