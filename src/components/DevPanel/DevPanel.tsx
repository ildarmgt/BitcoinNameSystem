import React, { useState, useEffect } from 'react'
import styles from './DevPanel.module.css'
import { Store } from '../../store/'
import { ActionTypes } from './../../interfaces/'

interface I_State {
  blShow: boolean
  setShow: React.Dispatch<React.SetStateAction<boolean>>
}

export const DevPanel = (props: any): JSX.Element => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // now can show dev panel whenever in npm run start instead of deployed build
  const TESTING = process.env.NODE_ENV === 'development'

  // store if DevPanel is hidden
  const [hidden, setHidden] = useState<boolean>(TESTING)

  // reruns to reattach keyup event to toggle hidden class
  useEffect(() => {
    const onDevKey = (e: any) => {
      if (e.key === '`') {
        setHidden(!hidden)
      } else {
        // give focus back to the input bar
        // if (document.activeElement?.id !== 'txtSearch') {
        //   const txtSearch = document.getElementById(
        //     'txtSearch'
        //   ) as HTMLTextAreaElement
        //   txtSearch?.focus()
        // }
      }
    }
    document.addEventListener('keyup', onDevKey)
    return () => {
      document.removeEventListener('keyup', onDevKey)
    }
  }, [hidden])

  const onOutlineClick = () => {
    const id = 'outliner'
    const sheet: HTMLElement | null = document.getElementById(id)
    if (!sheet) {
      const outlineCss = '* {box-shadow: 0 0 0 1px red;}'
      const style = document.createElement('style')
      style.type = 'text/css'
      style.id = id
      style.appendChild(document.createTextNode(outlineCss))
      document.head.appendChild(style)
    } else {
      sheet.parentNode?.removeChild(sheet)
    }
  }

  // const dlState = () => {
  //   const data =
  //     'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state))
  //   const a = document.createElement('a')
  //   a.href = 'data:' + data
  //   a.download = 'test.json'
  //   a.innerHTML = 'download JSON'
  //   const container = document.getElementById('container')
  //   container?.appendChild(a)
  //   a.click()
  //   a.remove()
  // }

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      className={[styles.divDev, !hidden ? styles.hidden : ''].join(' ')}
      {...props}
    >
      <div>
        <b>DevPanel</b>
      </div>

      {/* <div
        className={styles.button}
        onClick={() => {
          dlState()
        }}
      >
        Save File State
      </div>

      <div
        className={styles.button}
        onClick={() => {
          console.log(json)
          dispatch({ type: ActionTypes.LOAD_STATE, payload: json })
        }}
      >
        Load File State
      </div> */}

      <div
        className={[styles.btnOutline, styles.button].join(' ')}
        onClick={onOutlineClick}
      >
        Outline
      </div>

      <div
        className={[styles.button].join(' ')}
        onClick={() => {
          localStorage.setItem('state', JSON.stringify(state))
        }}
      >
        Save localStorage
      </div>

      <div
        className={[styles.button].join(' ')}
        onClick={() => {
          const state = JSON.parse(localStorage.getItem('state') || '')
          if (state) {
            dispatch({
              type: ActionTypes.LOAD_STATE,
              payload: { ...state, api: { ...state.api, processId: null } }
            })
          }
        }}
      >
        Load localStorage
      </div>

      <div
        className={styles.button}
        onClick={() => {
          console.log(state)
        }}
      >
        Console State
      </div>
    </div>
  )
}
