import { IState, Dispatch } from '../../interfaces'
import sanitize from '../../helpers/sanitize'
import { ActionTypes } from './../../interfaces'
const { TYPING } = ActionTypes;

/**
 * Cleans up the entered string including removing next line characters
 */
export const changeAliasAction = async (state: IState, dispatch: Dispatch, value: any) => {
  // clean up the string
  const newString = value
  const sanitizedString = sanitize(newString, 'url')

  return dispatch({
    type: TYPING,
    payload: sanitizedString
  })
}