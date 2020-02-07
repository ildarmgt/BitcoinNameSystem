import { calcP2WSH } from './calcP2WSH'
import { newState } from './initialState'
import * as actions from './actions'
import { I_BnsState } from './types'
import {
  setParsedHeight,
  updateSourceUserFromTx,
  getTxHeight,
  updateOwnerHistory
 } from './formathelpers'

/**
 * Returns ownership and notification information objects.
 * @param   {Array<any>}  notificationsHistory  - Array of any tx with notificationsAddress.
 * @param   {string}      domainName            - Full domainName to use (e.g. 'satoshi.btc').
 * @param   {number}      currentHeight         - Current blockheight of the network chain selected.
 * @param   {string}      networkChoice         - 'testnet' or 'bitcoin' (matches bitcoinjs-lib).
 * @returns {I_BnsState}                         - BNS state describing object.
 */
export const calcBnsState = (
  notificationsHistory: Array<any>,
  domainName: string,
  currentHeight: number,
  networkChoice: string
): I_BnsState => {

  // initialize temporary derivation state
  const st = JSON.parse(JSON.stringify(newState)); // deep object clone
  st.domain.domainName = domainName
  st.chain && (st.chain.currentHeight = currentHeight)
  st.domain.notificationAddress = calcP2WSH(domainName, networkChoice)?.notificationsAddress || ''

  // Sorting history from earliest to latest
  // reversing should speed it up if not complete it
  st.domain.txHistory = (notificationsHistory
    .slice().reverse()
    .sort((prev, next) => {
      const prevBlockHeight = prev.status.block_height
      const nextBlockHeight = next.status.block_height
      return prevBlockHeight - nextBlockHeight
    })
  )

  // iterate with blockheights of relevant tx to derive st state
  // Each tx blockheight serves as reference time
  st.domain.txHistory.forEach((tx: any) => {

    // update current chain's parsed height based on tx confirmed height
    setParsedHeight(st, getTxHeight(tx))

    // update or create new basic user info based on source address @ input0
    // this includes user's NONCE set to height of the user's tx prior to this one
    updateSourceUserFromTx(st, tx)

    // check if owner expired
    actions.runAllAutomaticChecks(st)

    // run all possible actions
    // starting with reading embedded data
    actions.runAllUserActions(st, tx)

    // update nonce
    // after this tx, this tx height is the last tx height, so the new nonce
    updateSourceUserFromTx(st, tx)

    // update ownership history each tx even if not owner
    updateOwnerHistory(st)
  })

  // final check for current block height
  setParsedHeight(st, currentHeight)

  actions.autoCheckForOwnerExpired(st)

  return st
}

