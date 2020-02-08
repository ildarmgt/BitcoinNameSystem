// for BNS
export enum BNSActions {
  RENEW = 'RENEW',
  ONLY_FORWARDS = 'ONLY_FORWARDS',
  CLAIM_OWNERSHIP = 'CLAIM_OWNERSHIP'
}

export interface I_BNS_Action {
  type: BNSActions
  info: string
  permissions: Array<any>
  conditions: Array<any>
  execute: () => void
  warning?: string | undefined
}

export interface I_BNS_Auto_Action {
  info: string
  conditions: Array<any>
  execute: () => void
}

export interface I_Action_Choice {
  type: BNSActions
  info: string
  special: Array<any>
}

export interface I_User {
  address:      string
  forwards:     Array<I_Forward>
  burnAmount:   number
  winHeight:    number
  winTimestamp: number
  nonce:        number
  updateHeight: number
}

  // each forward object has the following data
export interface I_Forward {
  network: string
  address: string
  updateHeight: number
  updateTimestamp: number
}

export interface I_BnsState {
  domain: I_Domain
  chain?: {
    parsedHeight: number
    currentHeight: number
  }
}

export interface I_Domain {
  domainName: string
  notificationAddress: string
  txHistory: Array<I_TX>
  utxoList: Array<I_UTXO>
  users: {
    [key: string]: I_User
  }
  currentOwner: string
  bidding: {}
  ownersHistory: Array<I_User>
}


export interface I_TX {
  txid: string
  version: number
  locktime: number
  size: number
  weight: number
  fee: number
  vin: Array <{
    txid: string
    vout: number
    prevout: {
      scriptpubkey: string
      scriptpubkey_asm: string
      scriptpubkey_type: string
      scriptpubkey_address: string
    }
    scriptsig: string
    scriptsig_asm: string
    witness: {
      [key: number]: string
    }
    is_coinbase: boolean
    sequence: number
  }>
  vout: Array <{
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    value: number
  }>
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
}

export interface I_UTXO {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height: number | null
    block_hash: string | null
    block_time: number | null
  }
  value: number
  hex?: string
}