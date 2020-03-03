import React from 'react'
import styles from './VisualAPI.module.css'
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
      last.props.setTasks !== undefined
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
    <div
      onClick={props.onClick}
      className={[styles.wrapper, props.className || ''].join(' ')}
    >
      <div className={styles.text}>
        {/* temp */}
        {(false || props.tasks.length > 0) && (
          <>API: {props.tasks.length} tasks</>
        )}
      </div>
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

  // check if you got a termination request
  if (last.loops[id.toString()]?.terminate) {
    // terminate. sad.
    console.log(`apiloop #${id} following termination request`)
    return undefined
  }

  // report if you're still alive
  const time = Date.now()
  const me = { id, time, terminate: false }
  last.loops = {
    [id.toString()]: me
  }

  // check if the loop doesn't match processId externally
  if (processId && id !== processId) {
    figureOutNewProcessId({ time, processId, id })
  }

  /* -------------------------- task execution start -------------------------- */

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
  }

  /* --------------------------- task execution end --------------------------- */

  // no tasks (array is empty) use standby rate, otherwise busy rate
  await delay(
    !tasks || tasks.length === 0 ? { ms: delayStandby } : { ms: delayBusy }
  )

  // loop self, no await, this call should terminate asap
  apiLoop({ delayStandby, delayBusy, id })
}

// assigns new processId, terminates older by initialization loops
const figureOutNewProcessId = ({
  time,
  processId,
  id
}: {
  [k: string]: number
}) => {
  // check if there are other loops registering recently
  let nLoopsAlive = 0
  Object.keys(last.loops).forEach((idKey: string) => {
    const otherLoop = last.loops[idKey]
    if (time - otherLoop.time < LOOP_TIMEOUT) {
      // if another loop hasn't timed out
      if (otherLoop.id === processId) {
        // and it matches correct id, set self to terminate
        last.loops[id.toString()].terminate = true
        console.log(`
          other living loop id #${id} matches processId ${processId}
          and the correct loop so terminating self
        `)
      } else {
        // if other loop(s) are not correct either do
        // nothing until they time out
      }
      nLoopsAlive++ // count living loops
    } else {
      // incorrect loops that timed out can be terminated if older
      // than this loop (consensus by id) leaving only 1 unterminated
      if (id > otherLoop.id) {
        console.log(`
        loop id #${id} detected another #${otherLoop.id}
        older loop so setting it to terminate
        `)
        otherLoop.terminate = true
      }
    }
  })
  // if you're the last living loop that isn't timed out,
  // update external processId reference
  if (nLoopsAlive === 1) {
    last.props.setProcessId(id)
    console.log(`${id} is new api loop`, last.loops)
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
