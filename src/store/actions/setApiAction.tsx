import { I_State, Dispatch } from '../../interfaces'
import { ActionTypes } from './../../interfaces'
const { SET_API } = ActionTypes;

/**
 * Updates API object.
 */
export const setApiAction = async (state: I_State, dispatch: Dispatch, api: any) => {

  return dispatch({
    type: SET_API,
    payload: api
  })
}
