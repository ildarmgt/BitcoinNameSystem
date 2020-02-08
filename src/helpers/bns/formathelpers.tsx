import { newUser } from './initialState'
import { OWNERSHIP_DURATION_BY_BLOCKS, MIN_BURN, MIN_NOTIFY } from './constants'
import { I_User, I_Forward, I_BnsState, I_TX } from './types/'
import { decrypt } from './cryptography'

// ========== helper functions =====================

export const existsCurrentOwner = (st: I_BnsState): boolean => st.domain.currentOwner !== ''

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
  if (existsCurrentOwner(st)) return true
  const owner = getOwner(st)
  if (!owner) return true
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
  if (!(fromAddress in st.domain.users)) {
    // create new user object by copying values of newUser object
    st.domain.users[fromAddress] = JSON.parse(JSON.stringify(newUser))
    console.log('new source created:')
  }

  // update user
  const user = st.domain.users[fromAddress]
  user.address = fromAddress
  user.nonce = user.updateHeight
  user.updateHeight = getTxHeight(tx)
  console.log('source:', user)
}

export const addToUserForwards = (
  st: I_BnsState,
  fromAddress: string,
  forwardsInThisTx: Array<I_Forward>
) => {
  const user = getUser(st, fromAddress)
  user.forwards = [...user.forwards, ...forwardsInThisTx]
}

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
    getTxHeight(tx),
    ': decryption key: ',
    st.domain.domainName,
    user.address,
    nonce
  )
  const embeddedDataUtf8 = decrypt(embeddedDataBuffer, decryptionKey)
  console.log(getTxHeight(tx), ': found embedded data:', embeddedDataUtf8)

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

export const noUnspentUserNotificationsUtxo = (st: I_BnsState, tx: I_TX): boolean => {

  return true
}
