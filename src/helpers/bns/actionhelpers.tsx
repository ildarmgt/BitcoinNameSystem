import { I_Checked_Action, I_Condition } from './types'

/**
 * Return all "get" suggestions of a checked action.
 * get = seeking input from user.
 * Within array, each getter is at suggestion.info.get.
 */
export const getGetters = (action: I_Checked_Action): Array<I_Condition> => {
  const getters = action.suggestions.filter((thisSuggestion: any) => {
    return 'get' in thisSuggestion.info
  })
  return getters
}

/**
 * Return all "set" suggestions of a checked action.
 * set = already know what the value is & necessary to set.
 * Within array, each setter is at suggestion.info.set.
 */
export const getSetters = (action: I_Checked_Action): Array<I_Condition> => {
  const setters = action.suggestions.filter((thisSuggestion: any) => {
    return 'set' in thisSuggestion.info
  })
  return setters
}
