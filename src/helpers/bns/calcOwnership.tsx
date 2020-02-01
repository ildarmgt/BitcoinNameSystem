import { calcP2WSH } from './calcP2WSH'
import { OWNERSHIP_DURATION_BY_BLOCKS, MIN_BURN, MIN_NOTIFY } from './constants'
import { decrypt } from './cryptography'

/**
 * Returns ownership and notification information objects.
 * @param   {Array<any>}  notificationsHistory  - array of any tx with notificationsAddress.
 * @param   {string}      domainName            - full domainName to use (e.g. 'satoshi.btc').
 * @param   {number}      currentHeight         - current blockheight of the network chain selected.
 * @param   {string}      networkChoice         - 'testnet' or 'bitcoin' (matches bitcoinjs-lib).
 * @returns {object}                            - { notifications, ownership } information objects.
 */
export const calcOwnership = (
  notificationsHistory: Array<any>,
  domainName: string,
  currentHeight: number,
  networkChoice: string
) => {

  // grab notification address
  const { notificationsAddress } = calcP2WSH(domainName, networkChoice)

  // start by sorting history from earliest to latest
  // reversing should speed it up if not complete it
  const sortedNotificationsHistory = notificationsHistory.slice().reverse().sort((prev, next) => {
    const aBlockHeight = prev.status.block_height
    const bBlockHeight = next.status.block_height
    return aBlockHeight - bBlockHeight
  })

  // object to track ownership of domainName through history
  interface IOwner {
    address: string
    forwards: Array<any>
    burnAmount: number
    winHeight: number
    winTimestamp: number
    lastUpdate: number
  }
  const resetOwner: IOwner = {  // values to reset owner when ownership is lost
    address: '',                // address in control
    forwards: [],               // for forwards later
    burnAmount: 0,              // burned to get ownership
    winHeight: 0,               // blockheight winning bid
    winTimestamp: 0,            // winHeight in block's timestamp
    lastUpdate: 0               // for parsing data later, last tx blockheight
  }
  const ownersHistory: Array<IOwner> = []          // history of all owners
  let currentOwner: IOwner = { ...resetOwner };   // clone initial values
  // Array to track utxo to redeem
  // const utxoToRedeem = []
  // Array to track notification utxo to consume
  // const utxoToConsume = []

  // iterate through all relevant tx history to derive ownership of this domainName
  sortedNotificationsHistory.forEach(tx => {
    ownersHistory.push(currentOwner) // update ownership history
    try {
      // Expiration: if OWNERSHIP_DURATION_BY_BLOCKS blocks since ownership update, no owner again
      const txBlockHeight = tx.status.block_height
      const blocksSinceUpdate = txBlockHeight - currentOwner.winHeight
      const isExpired = blocksSinceUpdate > OWNERSHIP_DURATION_BY_BLOCKS
      if (!!currentOwner.address && isExpired) {
        currentOwner = { ...resetOwner }
        console.log(domainName, txBlockHeight, 'ownership expired')
      }

      // Rules on ownership bid tx described in throw's
      if (!(tx.vout.length >= 2)) { throw new Error('Not enough outputs') }

      const isOpreturn = (tx.vout[0].scriptpubkey_asm.split(' ')[0] === 'OP_RETURN')
      if (!isOpreturn) { throw new Error('OP_RETURN missing from output index 0') }

      const txBurnAmount = tx.vout[0].value
      const didBurnMin = (txBurnAmount >= MIN_BURN)
      if (!didBurnMin) { throw new Error('Did not burn the minimum of ' + MIN_BURN) }

      const didNotifyMin = (tx.vout[1].value >= MIN_NOTIFY)
      if (!didNotifyMin) { throw new Error('Did not send enough for notify ' + MIN_BURN) }

      const isNotify = (tx.vout[1].scriptpubkey_address === notificationsAddress)
      if (!isNotify) { throw new Error('Notification output missing from output index 1') }

      // if no owner, good enough to give ownership
      if (!currentOwner.address) {
        currentOwner = {
          address: tx.vin[0].prevout.scriptpubkey_address,
          forwards: [...resetOwner.forwards],
          burnAmount: txBurnAmount,
          winHeight: txBlockHeight,
          winTimestamp: tx.status.block_time,
          lastUpdate: 0
        }
        console.log(domainName, txBlockHeight, 'new owner found:', currentOwner.address)
      }
    } catch (e) {
      console.log(e.message, '\n', tx)
    }
  })

  // Iterate through history one more time to build up forwards for this owner
  // rules are much more relaxed for forwards
  // just has to be from controlling address @ vin[0] and have data in op_return @ vout[0]
  // notification address must have been used for this tx to be in the list so can skip checking
  // Separate pass has convinience of being able to reuse forwards of same controlling address
  // Keep track of last notification tx by owner blockheight (before other checks) for aes nonce
  //
  // each forward object has the following data
  interface Iforward {
    network: string
    address: string
    updateHeight: number
    updateTimestamp: number
  }
  const collectedForwardsInHistory: (Array<Iforward> | []) = (sortedNotificationsHistory
    .reduce( (foundForwardsInHistory, tx) => {
      // is tx input #0 from owner's controlling address
      const txOwner = tx.vin[0].prevout.scriptpubkey_address
      const fromOwner = (txOwner === currentOwner.address)
      if (!fromOwner) { return foundForwardsInHistory } // skip tx bc irrelevant

      // If from owner, update blockheight as future nonce.
      // The only requirement for nonce update for this controlling address is for input [0] to be from this address.
      const nonce = currentOwner.lastUpdate.toString()        // prev update height by this owner or 0
      const txBlockHeight = tx.status.block_height
      currentOwner.lastUpdate = txBlockHeight                 // new update height

      const isOpreturn = (tx.vout[0].scriptpubkey_asm.split(' ')[0] === 'OP_RETURN')
      if (!isOpreturn) { return foundForwardsInHistory } // skip tx bc didn't have op_return so irrelevant

      // remove 'OP_RETURN '
      const embeddedDataHex = tx.vout[0].scriptpubkey_asm.split(' ').slice(2).join('')
      const embeddedDataBuffer = Buffer.from(embeddedDataHex, 'hex')
      // decrypt
      const decryptionKey = domainName + currentOwner.address + nonce
      const embeddedDataUtf8 = decrypt(embeddedDataBuffer, decryptionKey)
      // console.log('found asm', tx.vout[0].scriptpubkey_asm)
      // console.log('embeddedDataHex:', embeddedDataHex)
      console.log('found embedded data:', embeddedDataUtf8)

      // need to form array of forwards out of each tx (could be more than 1 defined)
      // and then combine these forwards across all tx for this owner
      const collectedForwardsInThisTx = (embeddedDataUtf8
        // data separated by utf8 spaces
        .split(' ')
        .reduce((foundForwardsInThisTx: (Array<Iforward> | []), networkPiece, index, embeddedTxDataArray) => {
          // only need to do on every 2nd data piece
          // for now only for cases where there is network id following each value
          const lastIndex = embeddedTxDataArray.length - 1 // largest array index I can call
          if ((index % 2 === 0) && (index < lastIndex)) {
            // every 2nd & safe index
            const forwardingAddressPiece = embeddedTxDataArray[index + 1] // forwarding address
            console.log('added', networkPiece, ':', forwardingAddressPiece)
            const thisForward = {
              network: networkPiece,
              address: forwardingAddressPiece,
              updateHeight: txBlockHeight,
              updateTimestamp: tx.status.block_time
            }
            return [
              ...foundForwardsInThisTx,
              thisForward
            ]
          } else {
            return foundForwardsInThisTx // skip if not a pair to end looping
          }
        }, [])
      )
      // adds collected network:forwards pairs from this tx to overall list of them
      return [
        ...foundForwardsInHistory,
        ...collectedForwardsInThisTx
      ]
    }, [])
  )

  // update forwards for owner object
  currentOwner.forwards = collectedForwardsInHistory

  // Check if last known ownership timed out. if so reset.
  const blocksSinceUpdate = currentHeight - currentOwner.winHeight
  const isExpired = blocksSinceUpdate > OWNERSHIP_DURATION_BY_BLOCKS
  if (!!currentOwner.address && isExpired) {
    ownersHistory.push(currentOwner) // update ownership history
    currentOwner = { ...resetOwner } // reset current owner
    console.log(domainName, currentHeight, 'current ownership expired')
  }

  // returns notification info and ownership info that includes current owners forwards
  return {
    notifications: {
      address: notificationsAddress,
      txHistory: sortedNotificationsHistory,
      utxoList: []
    },
    ownership: {
      current: currentOwner,
      topBidder: {}, // (TODO)
      history: ownersHistory
    }
  }
}
