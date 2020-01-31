import { IState, Dispatch, ActionTypes } from '../../interfaces'
import { calcP2WSH, calcOwnership } from '../../helpers/bns'
import { getAddressHistory, getHeight } from './../../api/blockstream'
const { STORE_SEARCH_RESULTS_FAIL, STORE_SEARCH_RESULTS } = ActionTypes;

/**
 * Get address,
 * tx with notification address,
 * calculate owner,
 * find current owner's forwarding info,
 * send/dispatch to reducer to store important data found
 */
export const searchAction = async (state: IState, dispatch: Dispatch, router: any = undefined) => {
  const domainName = state.alias + state.extension
  // stop if no alias submitted, nothing to save to state
  if (!state.alias) { return undefined }

  // find address for this alias
  const { notificationsAddress } = calcP2WSH(domainName, state.network)

  // (TODO) should check if max length for API reached to know if to use pages & append value (25?)

  try {

    // 1. Get current blockheight from API so ownership is using latest possible info

    const currentHeight = await getHeight(state.network)

    // 2. Get API response for all tx history of this address
    // This will grab all tx that "notified" this address by sending to it
    // Upon failure error should be caught in this function
    const notificationsTxHistory = await getAddressHistory(notificationsAddress, state.network)

    // calculate bns data from this history via helper functions
    const { notifications, ownership } = calcOwnership(
      notificationsTxHistory,
      domainName,
      currentHeight,
      state.network
    )

    // if navigated via id, use router to navigate home w/o id in url
    if (router) { router?.push('/') }

    // store data
    return dispatch({
      type: STORE_SEARCH_RESULTS,
      payload: {
        alias: state.alias,
        notifications,
        ownership,
        chain: {
          height: currentHeight
        }
      }
    })

  } catch (e) {
    console.log(e)
    // still updating the notification address
    return dispatch({
      type: STORE_SEARCH_RESULTS_FAIL,
      payload: {
        alias: state.alias,               // can save alias
        notificationsAddress              // can save this easy derivation
      }
    });
  }
}

// test address tb1qprkzdaqt5jkxrhy57ngvra8k0rvq63ulksz8cx85qwke3myhjrtq9s6nj3
// has mixture of tx sent to it on testnet
// https://blockstream.info/testnet/address/tb1qprkzdaqt5jkxrhy57ngvra8k0rvq63ulksz8cx85qwke3myhjrtq9s6nj3