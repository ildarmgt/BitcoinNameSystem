import React from 'react'
import styles from './VisualAPI.module.css'
import { Store } from '../../../store'

/**
 * Handles API requests
 */
export const VisualAPI = (props: any) => {
  // global state
  const { state } = React.useContext(Store)

  // Cloning StateCl that lets me access it inside async loop.
  // Every other method didn't seem to grab most recent state.
  // global -> stateCl clone -> st inside loop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stateCl, setStateCl] = React.useState(state)
  React.useEffect(() => { setStateCl(state) }, [state])

  /**
   * Main API Loop
   */
  const apiLoop = async () => {
    let st: any
    setStateCl((prevState: any) => {
      st = prevState   // grab cloned state value
      return prevState // don't actually change it
    })

    if (st) {
      // check first item in queue
      const task = state.api.tasks[0]

      if (task) {
        try {
          // run task with rate limit passed along if necessary
          const data = await task.run({ rateLimit: st.api.rateLimit })

          // run reply callback with response data as parameter
          task.reply({ data })

        } catch (error) {
          // reply with error
          task.reply({ error })
        }
      }
    }
    // delay for API rate limit
    await new Promise(r => setTimeout(r, 1000 / (st?.api.rateLimit || 2)))

    // loop
    apiLoop()
  }


  // assign props methods to use
  const { onApiInit } = props





  // launch api loop if haven't already
  const [apiOn, setApiOn] = React.useState(false)
  if (!apiOn) {
    apiLoop()
    setApiOn(true)
    if (onApiInit) onApiInit()
  }

  return (
    <div className={ styles.wrapper }>
      API: { state.api.tasks.length } tasks
    </div>
  )
}