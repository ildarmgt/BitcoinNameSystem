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

  // tasks
  const [tasks, setTasks]: [any, (args: any) => void] = React.useState([])

  // detect changes in url
  React.useEffect(() => {
    const onUrlChange = (e: any) => {
      setTasks(e.newURL)
      console.log(
        '%c new url detected:', e.newURL,
        '\nold:', e.oldURL,
        '\nevent:',
        e, 'background: lightgreen;'
      )
    }
    // event to detect url change
    window.addEventListener('hashchange', onUrlChange)
    // clean up function if removed (or changed)
    return () => {
      window.removeEventListener('hashchange',onUrlChange)
    }
  }, [])




  return (
    <div className={ styles.wrapper }>
      wallet state:
      { tasks }
    </div>
  )
}

/**
 *
 * what's best for passing data?
 * - querry strings
 *    - users can accidentally edit or on purpose
 *    - works cross origin
 *    - needs unique path or could be confusing to other components
 *    - confusing url for user (needs cleanup after read imo)
 *    - much less data can be passed (so have to get your own data)
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

