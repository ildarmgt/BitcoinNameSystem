import React from 'react'
import styles from './VisualAPI.module.css'
import { Spinner } from './../../general/Spinner'

console.log('VisualApi component imported')

const LOOP_TIMEOUT = 2000 // ms when loop is considered timed out

// persistent reference to capture latest state
const last: any = { props: {}, loops: {} }

/**
 * API rate limited task queue with visual interface.
 * @param setProcessId - function to run when API task queue launches.
 * @param processId - stores the id of the running loop
 * @param tasks - array of current tasks to watch
 * @param setTasks - action to remove 1 task
 * @param delayBusy - ms of delay when tasks exist.
 * @param delayStandby - ms of delay when no tasks
 */
export const VisualAPI = (props: any) => {
  // grab latest props on re-renders
  if (props.processId !== undefined) last.props.processId = props.processId
  last.props.setProcessId = props.setProcessId
  last.props.tasks = props.tasks
  last.props.setTasks = props.setTasks
  last.props.setBusy = props.setBusy
  last.props.busy = props.busy

  /* -------------------------------------------------------------------------- */
  /*                           api loop initialization                          */
  /* -------------------------------------------------------------------------- */

  // initialize api loop
  React.useEffect(() => {
    // processId is id (timestamp of creation) of loop that
    // was registered externally to be only one running
    const processId = last.props.processId // null or number

    // only initialize if have all the parameters
    if (
      last.props.processId !== undefined &&
      last.props.setProcessId !== undefined &&
      last.props.tasks !== undefined &&
      last.props.setTasks !== undefined &&
      last.props.setBusy !== undefined &&
      last.props.busy !== undefined
    ) {
      if (processId === null) {
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
            props.setProcessId(id)
          }
        })()
      }
    }
  }, [props])

  /* -------------------------------------------------------------------------- */
  /*                                  rendering                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <>
      <div
        onClick={props.onClick}
        className={[styles.wrapper, props.className || ''].join(' ')}
      >
        <div
          className={styles.text}
          onClick={() => {
            console.log(
              Object.keys(last.loops).map((loopKey: any) => ({
                ...last.loops[loopKey],
                timedOut: Date.now() - last.loops[loopKey].time > LOOP_TIMEOUT
              }))
            )
          }}
        >
          {props.message}
          {/* {props.tasks.length > 0 && <> ({props.tasks.length})</>} */}
        </div>
      </div>
      { props.tasks.length > 0 && <Spinner className={ styles.spinner } />}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  api loop                                  */
/* -------------------------------------------------------------------------- */
/**
 * Main API Loop.
 * Shorter delay { delayStandby: } is used when on standby (ms).
 * Longer delay { delayBusy: } is used with items in queue (ms).
 * @returns {
 *  id: (timestamp of initialization),
 *  launch: (function to launch loop)
 * }
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

  // grab constants global to this module from time of import
  const tasks = last.props.tasks
  const setTasks = last.props.setTasks
  const processId = last.props.processId

  // terminate if you got request
  if (checkSelfTerminate(id)) return undefined

  // report if you're still alive
  const time = Date.now()
  const me = { id, time, terminate: false }
  last.loops[id.toString()] = me

  // check if the loop doesn't match processId externally
  //if (processId && id !== processId) {
  handleWrongProcessIds({ time, processId, id })
  //}

  /* -------------------------- task execution start -------------------------- */

  const canRunTask = tasks && processId && id === processId && !last.props.busy

  if (canRunTask) {
    // check first item in queue
    const task = tasks[0]

    if (task) {
      try {
        // set as busy
        last.props.setBusy(true)
        // run task with rate limit passed along if necessary
        console.log(
          `apiloop #${id} executing api call`,
          JSON.stringify(last, null, 2)
        )
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

      // force delay before letting go of busy state
      // to prevent another async process
      // from running it too often
      delay({ ms: delayBusy })

      // update you're not using it
      last.props.setBusy(false)
    }
  }

  /* --------------------------- task execution end --------------------------- */

  // no tasks (array is empty) use standby rate
  if (!canRunTask || tasks.length === 0) {
    await delay({ ms: delayStandby })
  }

  // terminate if you got request
  if (checkSelfTerminate(id)) return undefined

  // loop self, no await, this call should terminate asap
  apiLoop({ delayStandby, delayBusy, id })
}

/* -------------------------------------------------------------------------- */
/*                             if wrong process id                            */
/* -------------------------------------------------------------------------- */

const checkSelfTerminate = (id: number) => {
  if (last.loops[id.toString()]?.terminate) {
    // terminate. sad.
    console.log(
      `apiloop #${id} following termination request`,
      JSON.stringify(last, null, 2)
    )
    return true
  } else {
    return false
  }
}

const handleWrongProcessIds = ({
  time,
  processId,
  id
}: {
  [k: string]: number
}) => {
  // check if there are other loops registering recently

  let isProcessIdLoopAlive = false
  let isThisTheNewestLoop = true
  Object.keys(last.loops).forEach((idKey: string) => {
    const otherLoop = last.loops[idKey]
    if (time - otherLoop.time < LOOP_TIMEOUT) {
      // note if there's an existing active process loop
      if (processId && otherLoop.id !== processId) isProcessIdLoopAlive = true
    }

    // terminate all older loops, note if you're newest
    if (otherLoop.id < id) {
      otherLoop.terminate = true
      isThisTheNewestLoop = false
    }
  })
  // if you're the last living loop that isn't timed out,
  // update external processId reference
  if (
    processId && // process id exists
    id !== processId && // you are not it yet
    !isProcessIdLoopAlive && // neither is any other living loop
    isThisTheNewestLoop // you are last loop
  ) {
    console.log(
      `${id} is new api loop replacing ${processId}`,
      JSON.stringify(last.loops, null, 2),
      last
    )
    last.loops[id.toString()].terminate = false
    last.props.setProcessId(id)
  }
}

/* -------------------------------------------------------------------------- */
/*                           event triggers for loop                          */
/* -------------------------------------------------------------------------- */

// send data this way instead of params (later)
// export const sendDataToAPI = (data: any) => {
//   return window.dispatchEvent(
//     new CustomEvent('apiloop_alivecheck', {
//       detail: { data }
//     })
//   )
// }

/**
 * Returns promise that resolves in given { ms: } or to give rate of { callsPerSec: }.
 * Don't forget to await it (again).
 */
const delay = (
  { callsPerSec = undefined, ms = undefined } = { ms: 500 }
): Promise<any> => new Promise(r => setTimeout(r, ms || 1000 / callsPerSec!))
