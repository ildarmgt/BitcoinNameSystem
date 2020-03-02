import { I_State, Dispatch } from '../../interfaces'
import { ActionTypes } from './../../interfaces'

import { createNewWallet, loadWallet } from '../../helpers/bns/bitcoin'

const { NEW_WALLET } = ActionTypes

/**
 * Create new wallet address & backup.
 * If mnemonic is provided, wallet is generated from that.
 */
export const createNewWalletAction = async (
  state: I_State,
  dispatch: Dispatch,
  strMnemonic = ''
) => {
  // load all the wallet info from mnemonic or generate new random mnemonic to do it
  const { mnemonic, WIF, address } =
    strMnemonic === ''
      ? createNewWallet(state.network)
      : loadWallet(strMnemonic, state.network)

  return dispatch({
    type: NEW_WALLET,
    payload: { mnemonic, WIF, address }
  })
}
