import { I_State, Dispatch } from '../../interfaces'
import { ActionTypes } from './../../interfaces'
const { SET_API } = ActionTypes

/**
 * Adds 1 api task and returns a promise of the result.
 * newTaskFunction must be a callback function (delayFunc)=>{ return something }
 * Example: (delay param is optional, based on prop used to create component)
 * const getUltra = await addNewApiTaskAction(state, dispatch, ({delay}) => ultraAPI(stuffForUltraAPI, delay))
 */
export const addNewApiTaskAction = async (
  state: I_State,
  dispatch: Dispatch,
  newTaskFunction: any
) => {
  return new Promise((resolve: any, reject: any) => {
    // wrapping task with resolve and reject
    const newTask = {
      run: newTaskFunction,
      resolve,
      reject,
      timestamp: Date.now()
    }

    // adding the task and ability to resolve it with value
    // to the end of task queue within payload
    const payload = {
      ...state.api,
      tasks: [...state.api.tasks, newTask]
    }

    // dispatching the payload to include it in state
    dispatch({ type: SET_API, payload })
  })
}
