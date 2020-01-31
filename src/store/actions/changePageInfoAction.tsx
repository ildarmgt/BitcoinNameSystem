import { IState, Dispatch, ActionTypes } from '../../interfaces'
const { CHANGE_PAGE_INFO } = ActionTypes;


/**
 * Request to change page info that's checked for validity here
 */
export const changePageInfoAction = async (state: IState, dispatch: Dispatch, page: number) => {
  // for now no checks

  const { pageInfo } = state
  pageInfo.current = page

  return dispatch({
    type: CHANGE_PAGE_INFO,
    payload: pageInfo
  })
}