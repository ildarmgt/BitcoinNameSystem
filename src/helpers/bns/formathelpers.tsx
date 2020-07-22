import bs58check from 'bs58check'
import { newUser, newState } from './initialState'
import {
  OWNERSHIP_DURATION_BY_BLOCKS,
  MIN_BURN,
  MIN_NOTIFY,
  CHALLENGE_PERIOD_DURATION_BY_BLOCKS,
  CHALLENGE_MIN_MULTIPLY
} from './constants'
import {
  I_User,
  I_Forward,
  I_BnsState,
  I_TX,
  I_UTXO,
  I_Bid,
  BnsBidType
} from './types/'
import { decryptToBuffer } from './cryptography'
import { deterministicRandomBid } from './deterministicRandom'

/* -------------------------------------------------------------------------- */
/*                              helper functions                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns true if owner exists.
 */
export const existsCurrentOwner = (st: I_BnsState): boolean =>
  st.domain.currentOwner !== ''
export const existsUser = (st: I_BnsState, address: string): boolean =>
  !!st.domain.users[address]

export const createNewUser = (st: I_BnsState, address: string): void => {
  // create new user
  st.domain.users[address] = JSON.parse(JSON.stringify(newUser))
  // update its address for easy access
  st.domain.users[address].address = address
}

export const getOwnerAddress = (st: I_BnsState): string =>
  st.domain.currentOwner || ''

export const setOwner = (st: I_BnsState, newOwnerAddress: string) => {
  st.domain.currentOwner = newOwnerAddress
}

export const getUser = (st: I_BnsState, address: string): I_User => {
  if (!existsUser(st, address)) {
    console.warn(
      'You called',
      getUser,
      'without checking if user exists via existsUser()'
    )
  }
  return st.domain.users[address]
}

export const getOwner = (st: I_BnsState) => {
  const ownerAddress = getOwnerAddress(st)
  if (!ownerAddress) return undefined
  return getUser(st, ownerAddress)
}

export const updateOwnerHistory = (st: I_BnsState): void => {
  st.domain.ownersHistory.push(
    getOwner(st) || JSON.parse(JSON.stringify(newUser))
  )
}

export const clearOwner = (st: I_BnsState): void => {
  st.domain.currentOwner = ''
}

export const getCurrentHeight = (st: I_BnsState): number =>
  st.chain?.currentHeight || 0
export const getParsedHeight = (st: I_BnsState): number =>
  st.chain?.parsedHeight || 0
export const setParsedHeight = (st: I_BnsState, height: number): void => {
  st.chain && (st.chain.parsedHeight = height)
}

export const getNotificationAddress = (st: I_BnsState): string =>
  st.domain.notificationAddress || ''

export const getLastOwnerBurnedValue = (st: I_BnsState): number =>
  getOwner(st)?.burnAmount || 0

export const isOwnerExpired = (st: I_BnsState): boolean => {
  if (!existsCurrentOwner(st)) return true // no owner same as expired
  const owner = getOwner(st)
  if (!owner) {
    console.log(
      'isOwnerExpired: owner exists but no user with such address stored'
    )
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

export const getTxOutput0BurnValue = (tx: I_TX): number =>
  tx.vout[0]?.value || 0
export const getTxOutput0Data = (tx: I_TX): string => {
  if (isOpreturnOutput0(tx)) {
    // remove 'OP_RETURN OP_PUSHBYTES_5 ' from it and return the rest
    return tx.vout[0].scriptpubkey_asm
      .split(' ')
      .slice(2)
      .join('')
  }
  return ''
}

export const getTxOutput1NotifyValue = (tx: I_TX): number =>
  tx.vout[1]?.value || 0
export const getTxOutput1NotifyAddress = (tx: I_TX): string =>
  tx.vout[1]?.scriptpubkey_address || ''

export const getTxInput0SourceUserAddress = (tx: I_TX): string =>
  tx.vin[0]?.prevout.scriptpubkey_address || ''

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
export const readEmbeddedData = (st: I_BnsState, tx: I_TX): void => {
  // only go on if there is op_return with embedded data on output 0
  if (!isOpreturnOutput0(tx)) {
    console.log(getTxHeight(tx), ': no op_return found for txid')
    return undefined
  }

  // get useful object references
  const fromAddress = getTxInput0SourceUserAddress(tx)
  const user = getUser(st, fromAddress)
  const nonce = getNonce(st, fromAddress).toString()

  // get embedded raw data hex
  const embeddedDataHex = getTxOutput0Data(tx)
  // convert hex to a buffer
  const embeddedDataBuffer = Buffer.from(embeddedDataHex, 'hex')

  // deterministic symmetric decryption key from nonce
  const decryptionKey = st.domain.domainName + user.address + nonce
  console.log(
    '%c------------ embeded data found -----------------\n',
    'color: green;',
    getTxHeight(tx),
    '  decryption key (w/ added spaces and pre hash): ',
    st.domain.domainName,
    user.address,
    nonce
  )
  // const embeddedDataUtf8 = decrypt(embeddedDataBuffer, decryptionKey)

  // decrypt embedded data buffer to decrypted buffer
  const embeddedDataBufferDecrypted = decryptToBuffer(
    embeddedDataBuffer,
    decryptionKey
  )
  console.log(
    '',
    getTxHeight(tx),
    '  found embedded data (raw buffer to utf8):',
    `"${embeddedDataBufferDecrypted.toString('utf8')}"`
  )

  // split by spaces into array
  const separator = Buffer.from(' ')
  const emptyBuffer = Buffer.from('')
  const embeddedDataBufferArray: Buffer[] = []
  for (let i = 0; i < embeddedDataBufferDecrypted.length; i++) {
    // go byte by byte through the decrypted buffer
    const thisByte = embeddedDataBufferDecrypted.slice(i, i + 1)
    // check if this byte is the separator
    const isSeparator = Buffer.compare(separator, thisByte) === 0
    // initialize new separated buffer
    if (i === 0) embeddedDataBufferArray.push(emptyBuffer)
    // on separators initialize another separated buffer
    if (isSeparator) embeddedDataBufferArray.push(emptyBuffer)
    // on non-separators add current byte to last buffer
    if (!isSeparator) {
      // if not separator or just starting, add this byte to the current separated buffer
      const wordIndex = embeddedDataBufferArray.length - 1
      embeddedDataBufferArray[wordIndex] = Buffer.concat([
        embeddedDataBufferArray[wordIndex],
        thisByte
      ])
    }
  }
  console.log(
    'array of entries:',
    embeddedDataBufferArray,
    '\nseparated:',
    embeddedDataBufferArray.reduce(
      (outputText: string, sepBuffer: Buffer) =>
        `${outputText} [${sepBuffer.toString('utf8')}]`,
      ''
    )
  )
  // const embeddedDataUtf8Array = embeddedDataUtf8.split(' ')

  // collect all forwards in this tx
  const forwardsInThisTx: Array<I_Forward> = []

  embeddedDataBufferArray.forEach((word: Buffer, index: number) => {
    // everything must be space separated in pairs
    // so single block might mean failed decryption or
    // last unpaired block might be padding or future versioning
    // grabbing only odd and 1 before it values, only grabbing pairs
    if (index % 2 === 1) {
      const networkPiece = embeddedDataBufferArray[index - 1].toString('utf8')
      const forwardingAddressPiece =
        networkPiece === '?'
          ? bs58check.encode(word) // if it's stealth address so base58check
          : word.toString('utf8') // otherwise it's just utf8

      const thisForward = {
        // encoding text here before inserting it into global state
        // encodeURIComponent() escapes all characters except: A-Z a-z 0-9 - _ . ! ~ * ' ( )
        // majority of usecases do not need special characters
        // for special cases users can just
        // create a rule for specific network to decodeURIComponent & handle carefully
        network: encodeURIComponent(networkPiece),
        address: encodeURIComponent(forwardingAddressPiece),
        updateHeight: getTxHeight(tx),
        updateTimestamp: getTxTimestamp(tx)
      }
      forwardsInThisTx.push(thisForward)
    }
  })

  // update forwards on the user
  addToUserForwards(st, fromAddress, forwardsInThisTx)

  console.log('%c------------------------------------------\n', 'color: green;')
}

// ===== rule checks (getters) =====

// Describe:    2 outputs minimum
export const atLeastTwoOutputs = (tx: I_TX): boolean => tx.vout.length >= 2

// Describe:    Is [0] output OP_RETURN type
export const isOpreturnOutput0 = (tx: I_TX): boolean =>
  tx.vout[0].scriptpubkey_asm.split(' ')[0] === 'OP_RETURN'

// Describe:    Is [1] output this domain's notification address?
export const isNotify = (st: I_BnsState, tx: I_TX): boolean =>
  getTxOutput1NotifyAddress(tx) === getNotificationAddress(st)

// Describe:    At least minimum amount used in notification output? (Dust level is main danger)
export const didNotifyMin = (tx: I_TX): boolean =>
  getTxOutput1NotifyValue(tx) >= MIN_NOTIFY

// Describe:    Is address the current domain owner?
export const isAddressTheCurrentOwner = (
  st: I_BnsState,
  address: string
): boolean => getOwnerAddress(st) === address

// Describe:    Is tx sender the current domain owner (input [0], id'ed by address)?
export const isSenderTheCurrentOwner = (st: I_BnsState, tx: I_TX): boolean =>
  getOwnerAddress(st) === getTxInput0SourceUserAddress(tx)

// Describe:    At least minimum amount burned?
export const didBurnMin = (tx: I_TX): boolean =>
  getTxOutput0BurnValue(tx) >= MIN_BURN

// Describe:    Burned at least as much as previously burnt
export const burnedPreviousRateMin = (st: I_BnsState, tx: I_TX): boolean =>
  getTxOutput0BurnValue(tx) >= getLastOwnerBurnedValue(st)

/**
 * Checks if this command exists at tx height from tx user.
 */
export const isCommandCalled = (
  st: I_BnsState,
  tx: I_TX,
  command: string
): boolean => {
  return !!getCommandCalled(st, tx, command)
}

/**
 * Gets command called in most recent forwards from user of tx.
 */
export const getCommandCalled = (
  st: I_BnsState,
  tx: I_TX,
  command: string
): I_Forward | undefined => {
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
      const spentUtxoIndex = st.domain.derivedUtxoList.findIndex(
        utxo => utxo.txid === txid && utxo.vout === vout
      )
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
export const noUnspentUserNotificationsUtxo = (
  st: I_BnsState,
  tx: I_TX
): boolean => {
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
    !userThatCreatedThisUtxo &&
      console.log(
        'st.domain.derivedUtxoList for some reason has undefined from_scriptpubkey_address'
      )
    // if even 1 matches, the check failed
    if (userThatCreatedThisUtxo === userOfTxAddress && isInThePast) {
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
  st.domain.bidding = {
    ...JSON.parse(JSON.stringify(newState.domain.bidding))
  }
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

  console.log(
    'Bidding period started at height',
    txHeight,
    'until',
    txHeight + CHALLENGE_PERIOD_DURATION_BY_BLOCKS
  )
}

/**
 * Add new bid.
 */
export const addBid = (st: I_BnsState, tx: I_TX, type: BnsBidType): void => {
  const userAddress = getTxInput0SourceUserAddress(tx)
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
    valueLeftToRefund: burnValue, // initially same as value
    blockHash: tx.status.block_hash
  }
  bids.push(bid)

  console.log('New bid from', userAddress, 'for', burnValue)
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
  if (biddingType !== BnsBidType.NULL && endHeight <= parsedHeight) {
    return true
  }
  return false
}

/**
 * Return true if there's a current bidding period.
 */
export const isBiddingOngoing = (st: I_BnsState): boolean => {
  if (!st.chain) throw new Error('called st.chain without it defined')

  // current parsed height (updated elsewhere)
  const parsedHeight = st.chain!.parsedHeight

  const biddingType = st.domain.bidding.type
  const endHeight = st.domain.bidding.endHeight
  const startHeight = st.domain.bidding.startHeight

  // real bidding type still assigned but height is at or above end height for bidding
  if (
    biddingType !== BnsBidType.NULL &&
    parsedHeight < endHeight &&
    parsedHeight >= startHeight
  ) {
    console.log('', parsedHeight, 'Action falls within bidding period.')
    return true
  }
  return false
}

/**
 * Return true if address is one of the bidders.
 */
export const isAddressACurrentBidder = (
  st: I_BnsState,
  address: string
): boolean => {
  if (!isBiddingOngoing) return false

  for (let i = 0; i < st.domain.bidding.bids.length; i++) {
    const bid = st.domain.bidding.bids[i]
    // if any bid address matches address provided return true
    if (bid.address === address) return true
  }

  return false // no match found
}

/**
 * Return true if user is one of the bidders.
 */
export const isSenderACurrentBidder = (st: I_BnsState, tx: I_TX): boolean => {
  const userAddress = getTxInput0SourceUserAddress(tx)
  return isAddressACurrentBidder(st, userAddress)
}

/**
 * Subtract refunded amounts from active bids.
 */
export const subtractRefunds = (st: I_BnsState, tx: I_TX): void => {
  const txUserAddress = getTxInput0SourceUserAddress(tx)
  const bids = st.domain.bidding.bids

  // create paidTo object with addresses as key for all refunds in the tx
  // (step to prevent O(N^2) scaling)
  const paidTo: { [address: string]: number } = {}
  for (const output of tx.vout) {
    const toAddress = output.scriptpubkey_address
    const toAmount = output.value

    if (
      toAddress !== undefined && // type of output that has an target address
      txUserAddress !== toAddress // isn't from the same address (sender === receiver is change, not refund)
    ) {
      // set paid amount or add onto existing
      paidTo[toAddress]
        ? (paidTo[toAddress] += toAmount)
        : (paidTo[toAddress] = toAmount)
    }
  }
  // paidTo object done

  // Apply paid object onto all bids
  for (let i = 0; i < bids.length; i++) {
    const thisBid = bids[i]
    const thisBidAddress = thisBid.address

    console.assert(
      thisBid.height >= st.domain.bidding.startHeight,
      `Bid height outside allowed range.`
    )
    console.assert(
      thisBid.height < st.domain.bidding.endHeight,
      `Bid height outside allowed range.`
    )

    // if paid to this address
    if (paidTo[thisBidAddress] !== undefined) {
      // each counted refund falls within range
      // [0, min(total refunds paid, left to refund for this bid)]
      // so valueLeftToRefund is 0 or positive only
      const refund = Math.max(
        Math.min(paidTo[thisBidAddress], thisBid.valueLeftToRefund),
        0
      )

      // subtract out the refund from both paid amount and valueLeftToRefund
      thisBid.valueLeftToRefund -= refund
      paidTo[thisBidAddress] -= refund
    }
  }
}

/**
 * Return array of bids with only unrefunded bids.
 */
export const unrefundedBidsOnly = (st: I_BnsState): Array<I_Bid> => {
  const bids = st.domain.bidding.bids

  const unrefundedBids: Array<I_Bid> = bids.filter((thisBid: I_Bid) => {
    return thisBid.valueLeftToRefund > 0
  })

  return unrefundedBids
}

/**
 * Return object with only addresses to refund as key and amounts left to refund as value.
 */
export const unrefundedAmounts = (
  st: I_BnsState
): { [key: string]: number } => {
  const unrefundedBids = unrefundedBidsOnly(st)

  const amounts = unrefundedBids.reduce((refundsLeft: any, thisBid: I_Bid) => {
    const address = thisBid.address
    const amount = thisBid.valueLeftToRefund
    // sums up amount left to refund per address
    return refundsLeft[address]
      ? { ...refundsLeft, [address]: refundsLeft[address] + amount }
      : { ...refundsLeft, [address]: amount }
  }, {})

  // console.log('unrefunded amounts:', amounts)

  return amounts
}

/**
 * Set new owner from bidding period.
 * Note: can be called unknown number of blocks after bidding period ended.
 */
export const endBidding = (st: I_BnsState): void => {
  // Rules for who wins bidding:
  // 1. List of all bids and how much they paid - have that in domain.bidding.bids.
  // 2. Remove all bids that have any prior (lower height) bids from other addresses that were not refunded.
  // 3. First potential winner is the first bid.
  //    At same height, winner is derived from deterministic pseudorandom function (using block's hash) weighted by bid amount.
  //    At increasing heights, new winner is who bid at least CHALLENGE_MIN_MULTIPLY times prior (lower height) winner's bid.

  // Step (1)
  const bids = st.domain.bidding.bids
  const unrefundedBids = unrefundedBidsOnly(st)

  // Step (2)

  // get all bids that refunded priors
  const goodBidsThatRefunded: Array<I_Bid> = []

  for (const thisBid of bids) {
    console.assert(
      thisBid.height >= st.domain.bidding.startHeight,
      `Bid height outside allowed range.`
    )
    console.assert(
      thisBid.height < st.domain.bidding.endHeight,
      `Bid height outside allowed range.`
    )

    const thisBidHeight = thisBid.height

    // check if any unrefunded past bids
    const hasUnrefundedPastBids = unrefundedBids.some(
      (thisUnrefundedBid: I_Bid) => {
        // return false if this isn't an unrefunded bid that matters

        // must not have unrefunded bids at lower height
        if (thisUnrefundedBid.height >= thisBidHeight) return false
        // only different addresses matter
        if (thisUnrefundedBid.address === thisBid.address) return false

        return true
      }
    )

    // if no unrefunded bids in the past, add to goodBidsThatRefunded
    if (!hasUnrefundedPastBids) {
      goodBidsThatRefunded.push(thisBid)
    }
  }

  // Step (3)
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
  let validBidsAtLastHeight: Array<I_Bid> = []
  let lastHeight = 0
  const maxBidIndex = goodBidsThatRefunded.length - 1
  for (let bidIndex = 0; bidIndex <= maxBidIndex; bidIndex++) {
    const thisBid = goodBidsThatRefunded[bidIndex]

    // get height from bid
    const thisHeight = thisBid.height

    if (thisBid.height > lastHeight) {
      // this means height went up so need to resolve previous heights:
      // set  winner from X possible winners in the array from previous height
      // if no entries, no change to winner

      // get winner from array of previous bid height winners
      winner = deterministicRandomBid(validBidsAtLastHeight) || winner

      // reset validBidsAtLastHeight
      validBidsAtLastHeight = []
    }

    // only push into bids array if it meets minimum criteria
    // compared with winner of lower height calculated this round or before
    const hasThisBidPaidEnough =
      thisBid.value >= CHALLENGE_MIN_MULTIPLY * winner.value

    if (hasThisBidPaidEnough) {
      validBidsAtLastHeight.push(thisBid)
    }

    // set last height based on this parsed bid
    lastHeight = thisHeight

    // final item update only (since there's no more bids after to step height)
    if (bidIndex === maxBidIndex) {
      // calc winner from array of same height bids, if possible
      winner = deterministicRandomBid(validBidsAtLastHeight) || winner
    }
  }

  // if there's a winner (should be, at least initial bid)
  if (winner.address !== '') {
    // set winner to owner
    setOwner(st, winner.address)
    getOwner(st)!.burnAmount = winner.value
    getOwner(st)!.winHeight = winner.height
    getOwner(st)!.winTimestamp = winner.timestamp
    console.log(
      '',
      winner.height,
      'Bidding winner and new owner is',
      winner.address
    )

    // resets all active bidding info, sets it to null values
    resetBidding(st)
  } else {
    throw new Error(
      'There should be no cases without a winner since at least 1st bid wins'
    )
  }
}
