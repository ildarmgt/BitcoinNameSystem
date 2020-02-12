import { I_User, I_BnsState, BnsBidType } from './types/'

/**
 * Initial values for BNS state
 */
export const newState: I_BnsState = {
  domain: {
    domainName:                   '',
    notificationAddress:          '',
    txHistory:                    [],
    derivedUtxoList:              [],
    utxoList:                     [],
    users:                        {},
    currentOwner:                 '',
    bidding: {
      startHeight:                0,
      endHeight:                  0,
      type:                       BnsBidType.NULL,
      bids:                       []
    },
    ownersHistory:                []
  },
  chain: {
    parsedHeight:                 0,
    currentHeight:                0
  }
}

/**
 * values to initialize users with
 */
export const newUser: I_User = {
  address:        '',
  forwards:       [],
  burnAmount:     0,
  winHeight:      0,
  winTimestamp:   0,
  nonce:          0,
  updateHeight:   0
}
