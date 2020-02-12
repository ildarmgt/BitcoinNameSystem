import { newUser, newState } from './initialState'
import { OWNERSHIP_DURATION_BY_BLOCKS, MIN_BURN, MIN_NOTIFY, CHALLENGE_PERIOD_DURATION_BY_BLOCKS } from './constants'
import { I_User, I_Forward, I_BnsState, I_TX, I_UTXO, I_Bid, BnsBidType } from './types/'
import { decrypt } from './cryptography'

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

export const getUser = (st: I_BnsState, address: string): I_User => st.domain.users[address]

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
  const nonce = user.nonce.toString()

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
    notificationsLeft: [],
    refundsLeft: []
  }
  bids.push(bid)

  console.log('New bid from', userAddress, 'for', burnValue)
}

/**
 * Set new owner from bidding period.
 * Note: can be called unknown number of blocks after bidding period ended.
 */
export const endBidding = (st: I_BnsState): void => {

  let winner = {
    address: '',
    height: 0,
    timestamp: 0,
    value: 0
  }

  // for now very simple rule of whoever bid most wins (temp)
  st.domain.bidding.bids.forEach(thisBid => {
    if (thisBid.value > winner.value) {
      winner = {
        address: thisBid.address,
        height: thisBid.height,
        timestamp: thisBid.timestamp,
        value: thisBid.value
      }
    }
  })

  // set winner to owner
  setOwner(st, winner.address)
  getOwner(st)!.burnAmount = winner.value
  getOwner(st)!.winHeight = winner.height
  getOwner(st)!.winTimestamp = winner.timestamp
  console.log('', winner.height, 'Bidding winner and new owner is', winner.address)

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