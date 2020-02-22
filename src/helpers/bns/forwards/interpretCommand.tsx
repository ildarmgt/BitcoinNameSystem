import { scanEveryActionForCommand } from './../actions/batch'

/**
 * Can grab simple words that explain what command does/did for visualization if found.
 * Only useful to grab text not dependent on any state.
 * Otherwise, returns undefined.
 */
export const interpretCommand = (key: string, value: string) => {

  // grab all basic action objects
  const allActions = scanEveryActionForCommand()


  // scan each for matching commmand
  let action
  for (let i = 0; i < allActions.length; i++) {
    if (key.startsWith(allActions[i].args.command)) {
      action = allActions[i]
      break
    }
  }

  if (!action) return undefined

  // scan for getters within
  let getterName
  for (let i = 0; i < action.permissions.length; i++) {
    if ('get' in action.permissions[i]().info) {
      console.log(action.permissions[i]())
      getterName = action.permissions[i]().info.get.name
      break
    }
  }

  if (!getterName) return undefined

  return {
    info: action.info,
    getterName,
    value
  }

}