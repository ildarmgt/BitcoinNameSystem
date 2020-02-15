import { newUser, newState } from './initialState'
import {
  OWNERSHIP_DURATION_BY_BLOCKS,
  MIN_BURN,
  MIN_NOTIFY,
  CHALLENGE_PERIOD_DURATION_BY_BLOCKS,
  CHALLENGE_MIN_MULTIPLY
} from './constants'
import { I_User, I_Forward, I_BnsState, I_TX, I_UTXO, I_Bid, BnsBidType } from './types/'
import { decrypt } from './cryptography'
import { deterministicRandomBid } from './deterministicRandom'

// ========== helper functions =====================

export const existsCurrentOwner = (st: I_BnsState): boolean => st.domain.currentOwner !== ''
export const existsUser = (st: I_BnsState, address: string): boolean => !!st.domain.users[address]

export const createNewUser = (st: I_BnsState, address: string): void => {
  // create new user
  st.domain.users[address] = JSON.parse(JSON.stringify(newUser))
  // update its address for easy access
  st.domain.users[address].address = address
}

export const getOwnerAddress = (st: I_BnsState): string => st.domain.currentOwner || ''

export const setOwner = (st: I_BnsState, newOwnerAddress: string) => {
  st.domain.currentOwner = newOwnerAddress
}


export const getUser = (st: I_BnsState, address: string): I_User => {
  if (!existsUser(st, address)) {
    console.warn('You called', getUser, 'without checking if user exists via existsUser()')
  }
  return st.domain.users[address]
}

export const getOwner = (st: I_BnsState) => {
  const ownerAddress = getOwnerAddress(st)
  if (!ownerAddress) return undefined
  return getUser(st, ownerAddress)
}

export const updateOwnerHistory = (st: I_BnsState): void => {
  st.domain.ownersHistory.push(getOwner(st) || JSON.parse(JSON.stringify(newUser)))
}

export const clearOwner = (st: I_BnsState): void => { st.domain.currentOwner = '' }

export const getCurrentHeight = (st: I_BnsState): number => st.chain?.currentHeight || 0
export const getParsedHeight = (st: I_BnsState): number => st.chain?.parsedHeight || 0
export const setParsedHeight = (st: I_BnsState, height: number): void => {
  st.chain && (st.chain.parsedHeight = height)
}

export const getNotificationAddress = (st: I_BnsState): string => st.domain.notificationAddress || ''

export const getLastOwnerBurnedValue = (st: I_BnsState): number => getOwner(st)?.burnAmount || 0

export const isOwnerExpired = (st: I_BnsState): boolean => {
  if (!existsCurrentOwner(st)) return true // no owner same as expired
  const owner = getOwner(st)
  if (!owner) {
    console.log('isOwnerExpired: owner exists but no user with such address stored')
    return true
  }
  const blocksSinceUpdate = getParsedHeight(st) - owner.winHeight
  return blocksSinceUpdate > OWNERSHIP_DURATION_BY_BLOCKS
}

/**
 * Returns nonce of user based on address.
 * If no previous user history for domain, nonce is 0, otherwise last tx height.
 */
export const getNonce = (st: I_BnsState, address: string): number => {
  const doesExist = existsUser(st, address)
  if (!doesExist) {
    return 0
  } else {
    const user = getUser(st, address)
    return user.nonce
  }
}


// ===== tx functions (getters) =====================

export const getTxTimestamp = (tx: I_TX): number => tx.status.block_time || 0
export const getTxHeight = (tx: I_TX): number => tx.status.block_height || 0

export const getTxOutput0BurnValue = (tx: I_TX): number => tx.vout[0]?.value || 0
export const getTxOutput0Data = (tx: I_TX):string => {
  if (isOpreturnOutput0(tx)) {
    // remove 'OP_RETURN OP_PUSHBYTES_5 ' from it and return the rest
    return tx.vout[0].scriptpubkey_asm.split(' ').slice(2).join('')
  }
  return ''
}

export const getTxOutput1NotifyValue = (tx: I_TX): number => tx.vout[1]?.value || 0
export const getTxOutput1NotifyAddress = (tx: I_TX): string => tx.vout[1]?.scriptpubkey_address || ''

export const getTxInput0SourceUserAddress = (tx: I_TX): string => (
  tx.vin[0]?.prevout.scriptpubkey_address || ''
)


// ======= update state from tx (setters) ========

// update the info for the source user of the tx within bns state
// when ran a second time, it simply updates nonce for post-tx value
export const updateSourceUserFromTx = (st: I_BnsState, tx: I_TX): void => {
  const fromAddress = getTxInput0SourceUserAddress(tx)

  // create new user if not already one of users
  // if (!(fromAddress in st.domain.users)) {
  if (!existsUser(st, fromAddress)) {
    // create new user object by copying values of newUser object
    createNewUser(st, fromAddress)
    console.log('new source created:', fromAddress)
  }

  // update user heights/times
  const user = st.domain.users[fromAddress]
  user.nonce = user.updateHeight
  user.updateHeight = getTxHeight(tx)
}

export const addToUserForwards = (
  st: I_BnsState,
  fromAddress: string,
  forwardsInThisTx: Array<I_Forward>
) => {
  const user = getUser(st, fromAddress)
  user.forwards = [...user.forwards, ...forwardsInThisTx]
}

// parse embedded data and store in forwards
export const readEmbeddedData = (st: I_BnsState, tx: I_TX):void => {
  // only go on if there is op_return with embedded data on output 0
  if (!isOpreturnOutput0(tx)) {
    console.log(getTxHeight(tx), ': no op_return found for txid')
    return undefined
  }

  // get useful object references
  const fromAddress = getTxInput0SourceUserAddress(tx)
  const user = getUser(st, fromAddress)
  const nonce = getNonce(st, fromAddress).toString()

  const embeddedDataHex = getTxOutput0Data(tx)
  const embeddedDataBuffer = Buffer.from(embeddedDataHex, 'hex')

  const decryptionKey = st.domain.domainName + user.address + nonce
  console.log(
    '',
    getTxHeight(tx),
    ': decryption key: ',
    st.domain.domainName,
    user.address,
    nonce
  )
  const embeddedDataUtf8 = decrypt(embeddedDataBuffer, decryptionKey)
  console.log('', getTxHeight(tx), ': found embedded data:', embeddedDataUtf8)

  // split by spaces into array
  const embeddedDataUtf8Array = embeddedDataUtf8.split(' ')

  // collect all forwards in this tx
  const forwardsInThisTx: Array<I_Forward> = []

  embeddedDataUtf8Array.forEach((word: string, index: number) => {
    // everything must be space separated in pairs
    // so single block might mean failed decryption or
    // last unpaired block might be padding or future versioning
    // grabbing only odd and 1 before it values, only grabbing pairs
    if (index % 2 === 1) {
      const networkPiece = embeddedDataUtf8Array[index - 1]
      const forwardingAddressPiece = word
      const thisForward = {
        network:          networkPiece,
        address:          forwardingAddressPiece,
        updateHeight:     getTxHeight(tx),
        updateTimestamp:  getTxTimestamp(tx)
      }
      forwardsInThisTx.push(thisForward)
    }
  })

  // update forwards on the user
  addToUserForwards(st, fromAddress, forwardsInThisTx)
}

// ===== rule checks (getters) =====

// Describe:    2 outputs minimum
export const atLeastTwoOutputs = (tx: I_TX): boolean => tx.vout.length >= 2

// Describe:    Is [0] output OP_RETURN type
export const isOpreturnOutput0 = (tx: I_TX): boolean => (
  tx.vout[0].scriptpubkey_asm.split(' ')[0] === 'OP_RETURN'
)

// Describe:    Is [1] output this domain's notification address?
export const isNotify =  (st: I_BnsState, tx: I_TX): boolean => (
  getTxOutput1NotifyAddress(tx) === getNotificationAddress(st)
)

// Describe:    At least minimum amount used in notification output? (Dust level is main danger)
export const didNotifyMin = (tx: I_TX): boolean => getTxOutput1NotifyValue(tx) >= MIN_NOTIFY

// Describe:    Is address the current domain owner?
export const isAddressTheCurrentOwner = (st: I_BnsState, address: string): boolean =>
  getOwnerAddress(st) === address

// Describe:    Is tx sender the current domain owner (input [0], id'ed by address)?
export const isSenderTheCurrentOwner = (st: I_BnsState, tx: I_TX): boolean =>
  getOwnerAddress(st) === getTxInput0SourceUserAddress(tx)

// Describe:    At least minimum amount burned?
export const didBurnMin = (tx: I_TX): boolean =>
  getTxOutput0BurnValue(tx) >= MIN_BURN

// Describe:    Burned at least as much as previously burnt
export const burnedPreviousRateMin = (st: I_BnsState, tx: I_TX): boolean => (
  getTxOutput0BurnValue(tx) >= getLastOwnerBurnedValue(st)
)

/**
 * Checks if this command exists at tx height from tx user.
 */
export const isCommandCalled = (
  st: I_BnsState,
  tx: I_TX,
  command: string
): boolean  => {
  return !!getCommandCalled(st, tx, command)
}

/**
 * Gets command called in most recent forwards from user of tx.
 */
export const getCommandCalled = (
  st: I_BnsState,
  tx: I_TX,
  command: string
): I_Forward | undefined  => {

  // get tx height (only current height is relevant for commands)
  const txHeight = getTxHeight(tx)
  // who sent the tx
  const fromAddress = getTxInput0SourceUserAddress(tx)
  // get user object of the tx sender
  const user = getUser(st, fromAddress)
  // array of forwards
  const forwards = user.forwards


  // scan height and name of each forward
  for (const thisForward of forwards) {
    const network = thisForward.network
    const forwardHeight = thisForward.updateHeight
    if (forwardHeight === txHeight) {
      // commands are identified via a string (starts with !)
      if (network.startsWith(command)) {
        // found it so return in
        return thisForward
      }
    }
  }

  return undefined
}

// Describe: update current derivedUtxoList from tx
// Since utxo in question are the notificaiton address utxo,
// they will always be part of txHistory
export const updateUtxoFromTx = (st: I_BnsState, tx: I_TX): void => {
  const notificationAddress = getNotificationAddress(st)

  // scan every tx input for notification address and remove those from utxo set
  tx.vin.forEach((input: any) => {
    // can scan by previous address or by current utxo list's txid+vout pairs
    if (input.prevout.scriptpubkey_address === notificationAddress) {
      const txid = input.txid
      const vout = input.vout
      // find first match with these values in derivedUtxoList
      const spentUtxoIndex = st.domain.derivedUtxoList.findIndex(utxo => (
        utxo.txid === txid && utxo.vout === vout
      ))
      // remove element at the position found
      // utxo can only be spent once so first match ok
      st.domain.derivedUtxoList.splice(spentUtxoIndex, 1)
    }
  })

  // scan every tx output for notification address and add those to utxo set
  tx.vout.forEach((output: any, vout: number) => {
    if (output.scriptpubkey_address === notificationAddress) {
      // if output address is notification address, it's always new utxo
      // mark from address as address @ input 0 of the tx
      st.domain.derivedUtxoList.push({
        txid: tx.txid,
        vout: vout,
        status: tx.status,
        value: output.value,
        from_scriptpubkey_address: getTxInput0SourceUserAddress(tx)
      } as I_UTXO)
    }
  })
}

// returns true only if there are no utxo (at notification address)
// where the sender address (input[0] in the past) is the same as
// the sender address of this tx (input[0])
export const noUnspentUserNotificationsUtxo = (st: I_BnsState, tx: I_TX): boolean => {
  // sender address of this tx
  const userOfTxAddress = getTxInput0SourceUserAddress(tx)
  const txHeight = getTxHeight(tx)

  // go through all derived utxo and make sure none are from this sender
  for (const utxo of st.domain.derivedUtxoList) {
    // user that created this utxo
    const userThatCreatedThisUtxo = utxo.from_scriptpubkey_address

    // block height of utxo creation
    const utxoHeight = utxo.status.block_height

    // only utxo formed before this tx height matter
    // this tx would've likely created a new utxo that shouldn't count
    const isInThePast = utxoHeight < txHeight

    // all utxo in derived set should have from address
    !userThatCreatedThisUtxo && console.log(
      'st.domain.derivedUtxoList for some reason has undefined from_scriptpubkey_address'
    )
    // if even 1 matches, the check failed
    if ((userThatCreatedThisUtxo === userOfTxAddress) && isInThePast) {
      return false
    }
  }

  // only gets this far if no utxo creators match our current tx user
  return true
}


/**
 * Reset bidding.
 */
export const resetBidding = (st: I_BnsState): void => {
  st.domain.bidding = { ...JSON.parse(JSON.stringify(newState.domain.bidding)) }
}

/**
 * Start bidding period.
 */
export const startBidding = (st: I_BnsState, tx: I_TX, type: BnsBidType) => {
  const txHeight = getTxHeight(tx)

  // reset bidding object just in case
  resetBidding(st)

  // start bidding pediod and set type
  st.domain.bidding.startHeight = txHeight
  st.domain.bidding.endHeight = txHeight + CHALLENGE_PERIOD_DURATION_BY_BLOCKS
  st.domain.bidding.type = type

  console.log('Bidding period started at height', txHeight, 'until', txHeight + CHALLENGE_PERIOD_DURATION_BY_BLOCKS)
}


/**
 * Add new bid
 */
export const addBid = (st: I_BnsState, tx: I_TX, type: BnsBidType): void => {
  const userAddress = getTxInput0SourceUserAddress(tx);
  const txHeight = getTxHeight(tx)
  const burnValue = getTxOutput0BurnValue(tx)

  // if bidding hasn't started
  if (txHeight > st.domain.bidding.endHeight) {
    startBidding(st, tx, type)
  }

  // add this new bid to bids
  const bids = st.domain.bidding.bids
  const bid: I_Bid = {
    height: txHeight,
    timestamp: getTxTimestamp(tx),
    address: userAddress,
    value: burnValue,
    valueLeftToRefund: burnValue,
    blockHash: tx.status.block_hash
  }
  bids.push(bid)

  console.log('New bid from', userAddress, 'for', burnValue)
}

/**
 * Set new owner from bidding period.
 * Note: can be called unknown number of blocks after bidding period ended.
 */
export const endBidding = (st: I_BnsState): void => {

  const startHeight = st.domain.bidding.startHeight
  const endHeight = st.domain.bidding.endHeight

  // filter out only relevant notification tx so don't have to filter every time
  const relevantTxHistory = st.domain.txHistory.filter((thisTx: I_TX) =>
    ((thisTx.status.block_height >= startHeight) && (thisTx.status.block_height < endHeight))
  )

  // v1. for now very simple rule of whoever bid most wins (temp)
  // st.domain.bidding.bids.forEach(thisBid => {
  //   if (thisBid.value > winner.value) {
  //     winner = {
  //       address: thisBid.address,
  //       height: thisBid.height,
  //       timestamp: thisBid.timestamp,
  //       value: thisBid.value
  //     }
  //   }
  // })

  // v2. more useful rules for who wins bidding:
  // - must have all previous bids (that got far enough to add to bids) refunded by anyone before deadline of end height
  // - refunds have to notify to count (so only need to scan notification tx)
  // - out of remaining bids, highest burn wins. must burn 2x of previously confirmed bid to win

  // plan
  // 1. list of all bids and how much they paid - have that in domain.bidding.bids!
  // 2. check all bids at bidding start height to this specific bid height - 1 and see if they were refunded (except bids by your own address)
  // 3. add this bid to list of valid bids if so
  // 4. parse through valid bids, replace running winner only if burn amount is 2x previous winner at lower height
  // 5. tie break same height valid winners by pseudo random number weighted by burn amounts (this will need tests)
  // 6. once done parsing, parse winner is new owner

  // in general it's more expensive to create bids than to refund them - helps limit spam. only output[0] bids count.

  // bids were added by height lowest to highest so list already sorted and
  // contains all relevant tx/heights that can be used to parse through heights

  // lets keep only bids that meet refund all previous bids rule
  const goodBidsThatRefunded: Array<I_Bid> = []
  const bidsLeftToRefund: Array<I_Bid> = []
  // parsing through history of bids
  for (const thisBid of st.domain.bidding.bids) {
    // update bidsLeftToRefund based on relevantTxHistory to see if they were refunded (with notificaiton)

    const thisBidHeight = thisBid.height

    // thisBid itself is not relevant to refund check, only its height is relevant for checking only lower heights
    // each bid is only responsible for bids before it
    // refunds from tx w/ height @ [startHeight,endHeight) are checked for each bid w/ height @ [startHeight, thisBidHeight - 1]
    const hasMetPastRefundCondition = wereAllBidsRefunded({
      txHistory: relevantTxHistory,
      bidHistory: bidsLeftToRefund,
      minHeight: startHeight,
      maxHeight: thisBidHeight - 1,
      ignoreAddress: thisBid.address
    })

    // if all prior bids were refunded, add this bid to the good bid list
    // otherwise it's ignored
    if (hasMetPastRefundCondition) {
      // add this bid to smaller list of bids meeting requirements
      goodBidsThatRefunded.push(thisBid)
    }

    // add this bid now to list of bids to refund for higher hights
    bidsLeftToRefund.push(thisBid)
  }

  // now with only a list of good bids with refunded priors, parse through them
  // to check that each bid at higher height paid/burned at least *(CHALLENGE_MIN_MULTIPLY) of next lower height bid
  let winner: I_Bid = {
    address: '',
    height: 0,
    timestamp: 0,
    value: 0,
    valueLeftToRefund: 0,
    blockHash: ''
  }
  let validBidsAtSameHeight: Array<I_Bid> = []
  let lastHeight = 0
  let maxIndex = goodBidsThatRefunded.length - 1
  for (let index = 0; index <= maxIndex; index++) {
    const thisBid = goodBidsThatRefunded[index]

    // get height from bid
    const thisHeight = thisBid.height

    if (thisBid.height > lastHeight) {
      // this means height went up so need to resolve previous heights:
      // set  winner from X possible winners in the array from previous height
      // if no entries, no change to winner

      // calc winner from array of same height bids, if possible
      winner = deterministicRandomBid(validBidsAtSameHeight) || winner

      // reset bidsAtSameHeight
      validBidsAtSameHeight = []
    }

    // only push into valid bids array if it meets criteria
    // compared with winner of lower height calculated this round or before
    const hasThisBidPaidEnough = thisBid.value >= (CHALLENGE_MIN_MULTIPLY * winner.value)

    if (hasThisBidPaidEnough) {
      validBidsAtSameHeight.push(thisBid)
    }

    // set last height based on this parsed bid
    lastHeight = thisHeight

    // final item update only (since there's no more bids after to step height)
    if (index === maxIndex) {
      // calc winner from array of same height bids, if possible
      winner = deterministicRandomBid(validBidsAtSameHeight) || winner
    }
  }

  // if there's a winner (should be, at least initial bid)
  if (winner.address !== '') {
    // set winner to owner
    setOwner(st, winner.address)
    getOwner(st)!.burnAmount = winner.value
    getOwner(st)!.winHeight = winner.height
    getOwner(st)!.winTimestamp = winner.timestamp
    console.log('', winner.height, 'Bidding winner and new owner is', winner.address)
  }

  // remove active bidding info
  resetBidding(st)
}


/**
 * Return true only if bidding was happening and hasn't been resolved yet into a winner.
 */
export const isBiddingOver = (st: I_BnsState): boolean => {
  // current parsed height (updated elsewhere)
  const parsedHeight = st.chain!.parsedHeight

  const biddingType = st.domain.bidding.type
  const endHeight = st.domain.bidding.endHeight

  // real bidding type still assigned but height is at or above end height for bidding
  if ((biddingType !== BnsBidType.NULL) && (endHeight <= parsedHeight)) {
    return true
  }
  return false
}


/**
 * Returns true only if all bids in range [minHeight,  maxHeight] were fully refunded in transactions provided.
 * txHistory must be provided for only range to check.
 * bidHistory will be limited to only ones to fall within the range.
 * The bidder's past address bids even if not refunded shouldn't matter (ignoreAddress for recepient)
 * Any payments by any address to itself should also be ignored.
 */
function wereAllBidsRefunded (
  { txHistory, bidHistory, minHeight, maxHeight, ignoreAddress }:
  { txHistory: Array<I_TX>, bidHistory: Array<I_Bid>, minHeight: number, maxHeight: number, ignoreAddress: string }
): boolean {

  // since parsing the same range of tx history for every bid
  // should copy bidHistory by local value so edits to it do not remain next time function is called
  const bidHistoryCopy = JSON.parse(JSON.stringify(bidHistory))

  // create ~hash table of total paid to each address so not to iterate through them every bid
  const paid: { [address: string]: number } = {}
  for (const tx of txHistory) {
    const senderAddress = getTxInput0SourceUserAddress(tx)
    for (const output of tx.vout) {
      // for each tx, for each output (payment could be in any of them)
      const toAddress = output.scriptpubkey_address // can be undefined if burned
      const toAmount = output.value
      // add up who got refunded by another address
      // ignore if burn or if sender is recepient
      if ((toAddress !== undefined) && (senderAddress !== toAddress)) {
        paid[toAddress] ? (paid[toAddress] += toAmount) : (paid[toAddress] = toAmount)
      }
    }
  }
  // paid object complete

  // subtract away refunded amounts
  for (let i = 0; i < bidHistoryCopy.length; i++) {
    const pastBid = bidHistoryCopy[i]
    if ((pastBid.height <= maxHeight) && (pastBid.height >= minHeight)) {
      // if bid falls within the height range of interest

      // address of who is owed refund for past bid
      const pastBidAddress = pastBid.address

      if (paid[pastBidAddress] !== undefined) {
        // if was refunded anything

        // paid[pastBidAddress] is refunds left
        // can't simply subtract, because could be multiple bids from same address (can't count same refund twice)
        // that are refunded with multiple payments to same address (refunds left starts as total)
        // if value left to refund is <= refunds left, should set value left to refund to 0 and refund left reduced by same amount.
        // if value left to refund is > refunds left, reduece refunds left to 0 and value left to refund by same amount.
        // in both cases we reduce both amounts by the minimum of the two numbers.
        // value left to refund should be ignored if it's below 0
        // refunds left is < 0 should not happen

        // 0 <= minRefund <= paid[pastBidAddress]
        const minRefund = Math.max(Math.min(pastBid.valueLeftToRefund, paid[pastBidAddress]), 0)
        // update both; if zero, no change
        pastBid.valueLeftToRefund -= minRefund // refund still needed
        paid[pastBidAddress] -= minRefund // refunds still unacounted for
      }

      // every bid is only checked once since it checks every tx payment at once
      // so after subtraction or lack of a payment match, each bid can be checked for
      // 1. paid out in full
      // 2. OR belongs to ignoreAddress for who this is being considered (refunds to self = useless)
      const isPaidInFull = (pastBid.valueLeftToRefund <= 0)
      const isIgnoredAddress = (pastBidAddress === ignoreAddress)
      // if is not paid in full and isn't ignored address, can safely return false
      // all other address bids MUST be paid (refunded) in full
      if (!isIgnoredAddress && !isPaidInFull) {
        console.log('not all predecesors refunded, failed to refund:', pastBid, 'bid considered is from', ignoreAddress)
        return false
      }
    }
  }

  // if the check doesn't fail after every bid scan, can return true
  console.log('all known predecesors are refunded. bid considered is from', ignoreAddress, '& checked for heights <=', maxHeight)
  return true
}
