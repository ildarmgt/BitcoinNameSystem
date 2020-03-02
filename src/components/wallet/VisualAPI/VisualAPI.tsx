import React from 'react'
import styles from './VisualAPI.module.css'

// persistent reference to capture latest state
const last: any = {}

/**
 * API rate limited task queue with visual interface.
 * @param onApiInit - function to run when API task queue launches.
 * @param processId - stores the id of the running loop
 * @param tasks - array of current tasks to watch
 * @param setTasks - action to remove 1 task
 * @param delayBusy - ms of delay when tasks exist.
 * @param delayStandby - ms of delay when no tasks
 */
export const VisualAPI = (props: any) => {
  last.props = props

  /* -------------------------------------------------------------------------- */
  /*                           api loop initialization                          */
  /* -------------------------------------------------------------------------- */

  // initialize api loop
  React.useEffect(() => {
    const processId = props.processId

    if (!processId) {
      // if no process id during rerender,
      // it means the loop starting hasn't been confirmed yet
      // so try to start
      const { delayStandby, delayBusy } = props
      ;(async () => {
        const loop = await apiLoop({
          delayBusy,
          delayStandby
        })

        if (loop) {
          // otherwise grab id and launch apiloop
          const { id, launch } = loop()
          launch()

          // send loop id back to user
          props.onApiInit(id)
        }
      })()
    }
  }, [props])

  /* -------------------------------------------------------------------------- */
  /*                                  rendering                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <div onClick={props.onClick} className={styles.wrapper}>
      API: {props.tasks.length} tasks
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  api loop                                  */
/* -------------------------------------------------------------------------- */
/**
 * Main API Loop.
 * Shorter delay { delayStandby: } is used when on standby (ms).
 * Longer delay { delayBusy: } is used with items in queue (ms).
 * @returns id (timestamp of initialization)
 */
const apiLoop = async ({
  delayStandby = 1000,
  delayBusy = 5000,
  id = null
}: {
  delayStandby?: number
  delayBusy?: number
  id?: number | null
}) => {
  // initialization w/o id with callback to launch loop with id
  if (!id) {
    const newId = Date.now()
    return () => ({
      id: newId,
      launch: () => apiLoop({ delayStandby, delayBusy, id: newId })
    })
  }

  // grab persistent reference tracker
  last.loops = { [id.toString()]: true }
  const tasks = last.props.tasks
  const setTasks = last.props.setTasks
  const processId = last.props.processId

  if (processId && id !== processId) {
    console.warn('api loop with wrong id was detected and terminated')
    return undefined
  }

  if (tasks) {
    // check first item in queue
    const task = tasks[0]

    if (task) {
      try {
        // run task with rate limit passed along if necessary

        const res = await task.run({
          delay: () => delay({ ms: delayBusy })
        })
        // send back solved value
        task.resolve(res)
      } catch (error) {
        console.warn(error)
        // reject promise
        task.reject(error)
      }

      // remove first task from queue
      setTasks(tasks.slice(1))
    }

    // delay for API rate limit
  }
  // no tasks (array is empty) use standby rate, otherwise busy rate
  await delay({ ms: delayStandby })
  // await delay(
  //   !tasks || tasks.length === 0 ? { ms: delayStandby } : { ms: delayBusy }
  // )
  // loop self
  apiLoop({ delayStandby, delayBusy, id })
}

/**
 * Returns promise that resolves in given { ms: } or to give rate of { callsPerSec: }.
 * Don't forget to await it (again).
 */
const delay = (
  { callsPerSec = undefined, ms = undefined } = { ms: 500 }
): Promise<any> => new Promise(r => setTimeout(r, ms || 1000 / callsPerSec!))
