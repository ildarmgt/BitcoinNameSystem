import React from 'react'
import styles from './Wallet.module.css'
// import { psbt } from './psbt'

/**
 * Reusable component for creating a wallet.
 * Let's pass secret data on creation with props.
 * Simulates behavior of browser wallet plugins without needing them.
 *
 */
export const Wallet = (props: any): JSX.Element => {
  // stores new URL
  // const [newURL, setNewURL]: [any, (args: any) => void] = React.useState()

  const [params, setParams]: [any, (args: any) => void] = React.useState({})

  // run methods to handle detection and processing of parameters after # in URL
  React.useEffect(() => {
    // url change handler
    const handleHashChange = () => {

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
            if ((thisKey in params) && (params[thisKey] === thisValue)) {
              // if so, no need to add
              return finalParamObject
            } else {
              // add changes
              return { ...finalParamObject, [thisKey]: thisValue }
            }
          }
        }, {})

      // only update state if there are new values, avoid pointless rerenders
      if (Object.keys(fedValues).length > 0) {
        const newParams = { ...params, ...fedValues }
        console.log('new wallet params added:', newParams)
        setParams(newParams)
      }
    }

    // event to detect url change
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      // clean up function if removed (or changed)
      window.removeEventListener('hashchange',handleHashChange)
      // clean up url as well
      resetUrl()
    }
  }, [params])

  return (
    <div className={ styles.wrapper }
      onClick={ () => {
        resetUrl()
      } }
    >
      { (TESTING) && (
        <>
          w
          { ' ' }
        </>
      ) }
    </div>
  )
}

// remove params from URL
const resetUrl = () => {
  window.history.pushState({}, '', `${ window.location.href.split('?')[0] }`)
  // emit event if param or url change needs to be detected
  // window.dispatchEvent(new HashChangeEvent("hashchange"));
}

// if development mode
const TESTING = (process.env.NODE_ENV === 'development')


/**
 *
 * what's best for passing data?
 * - querry strings
 *    - users can accidentally edit or on purpose (I like that it's visible and customizable)
 *    - works cross origin (just put in confirmation checks)
 *    - needs unique path or could be confusing to other components
 *    - confusing url for user (needs cleanup after read imo)
 *    - much less data can be passed (so have to get your own data)
 *    - if pass ? after #, not querry string so no forced rerender
 *      and separate from querry string search links
 *
 * - local storage
 *    - cross origin safe
 *    - harder to accidentally edit but also harder to customize
 *    - invisible to user
 *    - persistent across browser sessions
 *    - significant size, more than block size!
 *
 * - session storage
 *    - same as local storage but erased between browser sessions*
 *
 */


// url parameters after #:

// value could have base58 or similar so it's encoded
// keys are kept simple
// encodeURIComponent() escapes all characters except: A-Z a-z 0-9 - _ . ! ~ * ' ( )
// e.g. const randomDataFed1 = 'who1=' + encodeURIComponent('878b8=ABCD-=+_`' + Math.random().toFixed(2))

// window.origin is url up to but not including '/' before the '#'
// search params are found after '?' but before the '#'
// window.location.pathname is path after window.origin but before #
// then the rest is window.hash that includes # and everything after
// '?' after # are not search params so can be separate


// other way to update url:
// window.history.replaceState({}, '', `${location.pathname}?${params}`);

