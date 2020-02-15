import { I_State, Dispatch, ActionTypes } from '../../interfaces'
import { calcP2WSH, calcBnsState } from '../../helpers/bns'
import { getAddressHistory, getHeight } from './../../api/blockstream'
const { STORE_SEARCH_RESULTS_FAIL, STORE_SEARCH_RESULTS } = ActionTypes;

/**
 * Get address,
 * tx with notification address,
 * calculate owner,
 * find current owner's forwarding info,
 * send/dispatch to reducer to store important data found
 * (No UTXO nor raw TX scan for speed in front page search necessary yet)
 */
export const searchAction = async (state: I_State, dispatch: Dispatch, router: any = undefined) => {
  const domainName = state.alias + state.extension
  // stop if no alias submitted, nothing to save to state
  if (!state.alias) return undefined

  // find address for this alias
  const { notificationsAddress } = calcP2WSH(domainName, state.network)

  try {

    // 1. Get current blockheight from API so ownership is using latest possible info

    const currentHeight = await getHeight(state.network)

    // 2. Get API response for all tx history of this address
    // This will grab all tx that "notified" this address by sending to it
    // Upon failure error should be caught in this function
    const notificationsTxHistory = await getAddressHistory(notificationsAddress, state.network)

    // calculate bns data from this history via helper functions
    const { domain } = calcBnsState(
      notificationsTxHistory,
      domainName,
      currentHeight,
      state.network
    )

    // 3. if navigated via id, use router to navigate home w/o id in url
    if (router) { router?.push('/') }

    // store data
    return dispatch({
      type: STORE_SEARCH_RESULTS,
      payload: {
        alias: state.alias,
        domain,
        chain: {
          height: currentHeight
        }
      }
    })

  } catch (e) {
    console.log('searchAction issue found:', e)

    // if navigated via url id, use router to navigate home w/o id in url
    // even if api call failed, should navigate away or will be stuck in a loop
    if (router) { router?.push('/') }

    // still updating the notification address
    return dispatch({
      type: STORE_SEARCH_RESULTS_FAIL,
      payload: {
        alias: state.alias,               // can save alias
        domainName,
        notificationsAddress              // can save this easy derivation
      }
    });
  }
}
