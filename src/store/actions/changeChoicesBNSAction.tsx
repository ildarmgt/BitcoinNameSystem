import { I_State, Dispatch, ActionTypes } from '../../interfaces'
const { CHOICES_BNS_ACTION } = ActionTypes;

/**
 * Cleans up the entered string including removing next line characters
 */
export const changeChoicesBNSAction = async (
  state: I_State,
  dispatch: Dispatch,
  choices: any
) => {

  return dispatch({
    type: CHOICES_BNS_ACTION,
    payload: choices
  })
}

