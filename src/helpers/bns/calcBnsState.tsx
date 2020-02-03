import { calcP2WSH } from './calcP2WSH'
import { newState } from './initialState'
import * as actions from './actions'
import {
  setParsedHeight,
  updateSourceUserFromTx,
  getTxHeight,
  readEmbeddedData,
  updateOwnerHistory,
  getCurrentHeight
 } from './formathelpers'

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
  const st = newState;

  st.domain.domainName = domainName
  st.chain && (st.chain.currentHeight = currentHeight)

  // grab notification address
  st.domain.notificationAddress = calcP2WSH(domainName, networkChoice)?.notificationsAddress || ''

  // Sorting history from earliest to latest
  // reversing should speed it up if not complete it
  st.domain.txHistory = (notificationsHistory
    .slice().reverse()
    .sort((prev, next) => {
      const aBlockHeight = prev.status.block_height
      const bBlockHeight = next.status.block_height
      return aBlockHeight - bBlockHeight
    })
  )

  // (TODO) spends to redeem / utxo to consume

  // ========================= MAIN LOOP ===================

  // iterate with blockheights of relevant tx to derive st state
  // Each tx blockheight serves as reference time
  st.domain.txHistory.forEach(tx => {

    // update current parsed height based on tx confirmed height
    setParsedHeight(st, getTxHeight(tx))

    // update or create new basic user info based on source address @ input0
    // this includes nonce set to previous update height for this user
    updateSourceUserFromTx(st, tx)

    // check if owner expired
    actions.runAllAutomaticChecks(st)

    // read embedded data
    readEmbeddedData(st, tx)

    // run all possible actions
    actions.runAllUserActions(st, tx)

    // update ownership history each tx
    updateOwnerHistory(st)

  })

  // final check for current block height
  setParsedHeight(st, getCurrentHeight(st))
  actions.autoCheckForOwnerExpired(st)

  return {
    domain: st.domain
  }
}

