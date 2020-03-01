import { I_State, Dispatch, ActionTypes } from '../../interfaces'
import { calcP2WSH, calcBnsState } from '../../helpers/bns'
import {
  getAddressHistoryAPI,
  getUTXOListAPI,
  addRawTxToArrayAPI,
  getHeightAPI
} from '../../api/blockstream'
const { UPDATE_WALLET, UPDATE_DOMAIN, ACTION_FAIL } = ActionTypes

/**
 * Scans the address for utxo on a given network (w/ API).
 * Add hex of each tx that created utxo (for psbt).
 * addressType is one of enums ActionTypes that's either UPDATE_WALLET or UPDATE_NOTIFICATION.
 * If scanning wallet, then update wallet state.
 * If scanning notification address, then update notification state.
 * Notification scan will reproduce address scan first before getting details.
 */
export const scanAddressFullyAction = async (
  state: I_State,
  dispatch: Dispatch,
  addressType: ActionTypes
) => {
  const domainName = state.alias + state.extension

  // wallet address scan
  if (addressType === UPDATE_WALLET) {
    // wallet address

    try {
      // 1. get address TX history

      const walletAddress = state.wallet.address
      const walletTxHistory = await getAddressHistoryAPI(
        walletAddress,
        state.network,
        state.api.path
      )

      // 2. get address UTXO list (could also calculate from tx history or API)

      const utxoListWalletAddress = await getUTXOListAPI(
        walletAddress,
        state.network,
        state.api.path
      )

      // 3. get raw tx for each UTXO (psbt requirement for creating new tx later)

      const { utxoList, erroredOutputs } = await addRawTxToArrayAPI(
        utxoListWalletAddress,
        state.network,
        state.api.path
      )

      !!erroredOutputs &&
        console.log('API had issues during hex utxo scan:', erroredOutputs)

      return dispatch({
        type: UPDATE_WALLET,
        payload: {
          wallet: {
            txHistory: walletTxHistory,
            utxoList: utxoList
          }
        }
      })
    } catch (e) {
      console.log('Wallet address scan failed')
      console.log(e)
      // abort
      return dispatch({
        type: ACTION_FAIL,
        payload: {}
      })
    }
  }

  // notification address scan
  if (addressType === UPDATE_DOMAIN) {
    try {
      // 1. get current blockheight from API so ownership is using latest possible info

      const currentHeight = await getHeightAPI(state.network, state.api.path)

      // 2. get address TX history

      const { notificationsAddress } = calcP2WSH(domainName, state.network)
      const notificationsTxHistory = await getAddressHistoryAPI(
        notificationsAddress,
        state.network,
        state.api.path
      )

      // 3. derive new BNS domain state & utxo
      const { domain: newDomain } = calcBnsState(
        notificationsTxHistory,
        domainName,
        currentHeight,
        state.network
      )

      // 4. get raw tx for each UTXO (psbt requirement for creating new tx later)

      const { erroredOutputs } = await addRawTxToArrayAPI(
        newDomain.derivedUtxoList,
        state.network,
        state.api.path
      )

      !!erroredOutputs &&
        console.log('API had issues during hex utxo scan:', erroredOutputs)

      return dispatch({
        type: UPDATE_DOMAIN,
        payload: {
          domain: newDomain,
          chain: {
            height: currentHeight
          }
        }
      })
    } catch (e) {
      console.log('Notification address scan failed')
      console.log(e)
      // abort
      return dispatch({
        type: ACTION_FAIL,
        payload: {}
      })
    }
  }

  throw new Error('unexpected address type')
}
