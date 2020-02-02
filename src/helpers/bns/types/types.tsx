
/**
 * All possible types of Bitcoin Name System Actions (BNSA)
 */
export enum BNSActionTypes {
  GET_AVAILABLE_DOMAIN          = 'GET_AVAILABLE_DOMAIN',       // attempt to get available domain
  EXTEND_OWNERSHIP_DURATION     = 'EXTEND_OWNERSHIP_DURATION',  // extend ownership duration
  PUSH_FORWARDING_INFO          = 'PUSH_FORWARDING_INFO'        // update forwarding information
}

export interface IUser {
  address:      string
  forwards:     Array<any>
  burnAmount:   number
  winHeight:    number
  winTimestamp: number
  updateHeight: number
}

  // each forward object has the following data
export interface Iforward {
  network: string
  address: string
  updateHeight: number
  updateTimestamp: number
}

export interface IBnsState {
  domain: {
    domainName: string
    address: string
    txHistory: Array<any>
    utxoList: Array<any>
    sources: {
      [key: string]: any
    }
    currentOwner:  string
    bidding: {}
    ownersHistory: Array<IUser>
  }
  chain: {
    parsedHeight: number
    nonce: number
    currentHeight: number
  }
}