import { IState, Dispatch, ActionTypes } from '../../interfaces'
import { calcP2WSH, calcOwnership } from '../../helpers/bns'
import { getAddressHistory, getUTXOList, addRawTxToArray, getHeight } from '../../api/blockstream'
const { UPDATE_WALLET, UPDATE_NOTIFICATION_ADDRESS, ACTION_FAIL } = ActionTypes

/**
 * Scans the address for utxo on a given network (w/ API).
 * Add hex of each tx that created utxo (for psbt).
 * addressType is one of enums ActionTypes that's either UPDATE_WALLET or UPDATE_NOTIFICATION.
 * If scanning wallet, then update wallet state.
 * If scanning notification address, then update notification state.
 * Notification scan will reproduce address scan first before getting details.
 */
export const scanAddressFullyAction = async (
  state: IState,
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
      const walletTxHistory = await getAddressHistory(walletAddress, state.network)

      // 2. get address UTXO list (could also calculate from tx history or API)

      const utxoListWalletAddress = await getUTXOList(walletAddress, state.network)

      // 3. get raw tx for each UTXO (psbt requirement...)

      const { arrayUtxoWithHex, erroredOutputs } = await addRawTxToArray(utxoListWalletAddress, state.network)

      console.log({ walletAddress, walletTxHistory, utxoListWalletAddress, arrayUtxoWithHex, erroredOutputs })

      return dispatch({
        type: addressType,
        payload: {
          wallet: {
            txHistory: walletTxHistory,
            utxoList: arrayUtxoWithHex
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
      });
    }
  }

  // notification address scan
  if (addressType === UPDATE_NOTIFICATION_ADDRESS) {


    try {

      // 1. get current blockheight from API so ownership is using latest possible info

      const currentHeight = await getHeight(state.network)

      // 2. get address TX history

      const { notificationsAddress } = calcP2WSH(domainName, state.network)
      const notificationsTxHistory = await getAddressHistory(notificationsAddress, state.network)
      const { notifications, ownership } = calcOwnership(
        notificationsTxHistory,
        domainName,
        currentHeight,
        state.network
      )

      // 3. get address UTXO list (could also calculate from tx history or API)

      const utxoListNotificationAddress = await getUTXOList(notificationsAddress, state.network)

      // 4. get raw tx for each UTXO (psbt requirement...)

      const { arrayUtxoWithHex, erroredOutputs } = await addRawTxToArray(utxoListNotificationAddress, state.network)

      console.log({ notifications, ownership, utxoListNotificationAddress, arrayUtxoWithHex, erroredOutputs })

      return dispatch({
        type: addressType,
        payload: {
          notifications: {
            address: notificationsAddress,
            txHistory: notifications.txHistory, // sorted
            utxoList: arrayUtxoWithHex
          },
          ownership: {
            ...ownership
          },
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
      });
    }

  }

  throw new Error('unexpected address type')
}