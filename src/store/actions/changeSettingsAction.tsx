import { I_State, Dispatch } from '../../interfaces'
import { initialState } from './../initialState'
import { ActionTypes } from '../../interfaces'
const { CHANGE_SETTINGS } = ActionTypes

/**
 * Apply passed in function to the initial state object
 * so can modify whatever values while reseting state
 */
export const changeSettingsAction = async (
  state: I_State,
  dispatch: Dispatch,
  transformation: (state: I_State) => any,
  reset = true
) => {
  // clone initial state
  const newState = reset
    ? JSON.parse(JSON.stringify(initialState))
    : { ...state }
  // apply transformation function
  transformation(newState)

  return dispatch({
    type: CHANGE_SETTINGS,
    payload: newState
  })
}
