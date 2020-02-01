/**
 * All the interfaces
 */

export enum ActionTypes {
  STORE_SEARCH_RESULTS = 'STORE_SEARCH_RESULTS',
  STORE_SEARCH_RESULTS_FAIL = 'STORE_SEARCH_RESULTS_FAIL',
  TYPING = 'TYPING',
  NEW_WALLET = 'NEW_WALLET',
  CHANGE_PAGE_INFO = 'CHANGE_PAGE_INFO',
  UPDATE_WALLET = 'UPDATE_WALLET',
  UPDATE_NOTIFICATION_ADDRESS = 'UPDATE_NOTIFICATION_ADDRESS',
  ACTION_FAIL = 'ACTION_FAIL',
  LOAD_STATE = 'LOAD_STATE'
}

export type Dispatch = React.Dispatch<IAction>

export interface IState {
  network: string
  alias: string
  extension: string
  notifications: {
    address: string
    txHistory: Array<any>
    utxoList: Array<any>
    checkedHistory: boolean
    checkedUtxo: boolean
  }
  wallet: {
    WIF: string
    address: string
    mnemonic: string
    txHistory: Array<any>
    utxoList: Array<any>
    checkedHistory: boolean
    checkedUtxo: boolean
  }
  ownership: {
    current: {
      address: string
      forwards: [ {
        network: string
        address: string
        updateHeight: number
        updateTimestamp: number
      } ] | []
      burnAmount: number
      winTimestamp: number
      winHeight: number
      updateHeight: number
    }
    topBidder: object
    history: []
    checked: boolean
  }
  chain: {
    height: number
  }
  pageInfo: {
    current: number
  }
  settings: {
    feeRate: number
  }
  lastTimeStamp: number
}

export interface IAction {
  type: ActionTypes
  payload: any
}
