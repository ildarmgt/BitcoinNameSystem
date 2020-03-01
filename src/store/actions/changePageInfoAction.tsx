import { I_State, Dispatch, ActionTypes } from '../../interfaces'
const { CHANGE_PAGE_INFO } = ActionTypes

/**
 * Request to change page info that's checked for validity here
 */
export const changePageInfoAction = async (
  state: I_State,
  dispatch: Dispatch,
  page: number
) => {
  // for now no checks

  return dispatch({
    type: CHANGE_PAGE_INFO,
    payload: page
  })
}
