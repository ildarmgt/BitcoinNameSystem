import React from 'react'
import styles from './VisualAPI.module.css'
import { Store } from '../../../store'

// to grab last state
const last: any = {}

const delay = async ({ callsPerSec = undefined, seconds = undefined } = { seconds: 0.5 }) => {
  await new Promise(r => setTimeout(r, seconds || (1000 / callsPerSec!)))
}


/**
 * Handles API requests
 */
export const VisualAPI = (props: any) => {
  // global state
  const { state } = React.useContext(Store)
  last.state = state

  /**
   * Main API Loop
   */
  const apiLoop = async () => {
    const st = last.state
    if (st) {
      // check first item in queue
      const nTasks = state.api.tasks.length
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


    // loop
    apiLoop()
  }

  // assign props methods to use
  const { onApiInit } = props

  // launch api loop if haven't already
  const [apiOn, setApiOn] = React.useState(false)
  if (!apiOn) {
    setApiOn(true)
    apiLoop()
    if (onApiInit) onApiInit()
  }

  return (
    <div className={ styles.wrapper }>
      API: { state.api.tasks.length } tasks
    </div>
  )
}