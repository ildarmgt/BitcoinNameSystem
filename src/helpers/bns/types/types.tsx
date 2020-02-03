

export interface IUser {
  address:      string
  forwards:     Array<Iforward>
  burnAmount:   number
  winHeight:    number
  winTimestamp: number
  nonce:        number
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
  domain: IDomain
  chain?: {
    parsedHeight: number
    currentHeight: number
  }
}

export interface IDomain {
  domainName: string
  notificationAddress: string
  txHistory: Array<any>
  utxoList: Array<any>
  users: {
    [key: string]: IUser
  }
  currentOwner: string
  bidding: {}
  ownersHistory: Array<IUser>
}
