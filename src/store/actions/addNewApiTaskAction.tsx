import { I_State, Dispatch } from '../../interfaces'
import { ActionTypes } from './../../interfaces'
const { SET_API } = ActionTypes

/**
 * Adds 1 api task.
 */
export const addNewApiTaskAction = async (
  state: I_State,
  dispatch: Dispatch,
  newTask: any
) => {
  // just adding new task to the end
  const newApiObject = {
    ...state.api,
    tasks: [...state.api.tasks, newTask]
  }

  return dispatch({
    type: SET_API,
    payload: newApiObject
  })
}
