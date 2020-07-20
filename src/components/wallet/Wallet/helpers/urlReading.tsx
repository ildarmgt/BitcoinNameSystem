/* -------------------------------------------------------------------------- */
/*                           reading params from url                          */
/* -------------------------------------------------------------------------- */

// curried url change handler (might be worth removing completely)
export const handleHashChange = (params: any, setParams: any) => (): void => {
  // if (e) console.warn(e)

  // convert url string starting with # into key/value pair object
  // #/ok/?a=b&c=d becomes { a:b, c:d }
  const fedValues = window.location.hash
    .split('#')
    .slice(1) // removes all before 1st # and 1st #
    .join('')
    .split('?')
    .slice(1) // removes all before 1st ? and 1st ?
    .join('')
    .split('&') // split between sets of key-value pairs
    .reduce((finalParamObject: any, thisKeyValue: string) => {
      // assume values were passed through encodeURIComponent() so only '=' are from standard format
      const splitKeyValue = thisKeyValue.split('=')
      const thisKey = splitKeyValue[0]
      const thisValue = decodeURIComponent(splitKeyValue[1])
      if (thisKey === '') {
        // no change
        return finalParamObject
      } else {
        // check if key/value already exist within params
        if (thisKey in params && params[thisKey] === thisValue) {
          // if so, no need to add
          return finalParamObject
        } else {
          // add changes
          console.log(thisKey)
          return { ...finalParamObject, [thisKey]: thisValue }
        }
      }
    }, {})

  // only update state if there are new values, avoid pointless refresh
  if (Object.keys(fedValues).length > 0) {
    const newParams = { ...params, ...fedValues }
    console.log('new params added:', newParams)
    setParams(newParams)
  }

  // clean up url as well
  resetUrl()
}

// remove params from URL
export const resetUrl = () => {
  window.history.pushState({}, '', `${window.location.href.split('?')[0]}`)
  // emit event if param or url change if needs to be detected
  // window.dispatchEvent(new HashChangeEvent("hashchange"));
}
