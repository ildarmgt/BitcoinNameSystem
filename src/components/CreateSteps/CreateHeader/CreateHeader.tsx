import React, { useEffect, useState } from 'react'
import styles from './CreateHeader.module.css'
import { Store } from '../../../store/'
import { useHistory } from 'react-router-dom'

// restore backup or create new
export const CreateHeader = () => {
  // global state
  const { state } = React.useContext(Store)

  const domainName = state.alias + state.extension

  // navigation object
  const history = useHistory()

  // Make sure entire alias is always visible on top through
  // resizing based on letter count.
  //
  // get window width in component instance state 'width'
  // so can resize alias based on char count
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const resize = () => {
      setWidth(window.innerWidth)
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // enforces max size to font size so 1 letter alias has same font as 19 letter alias
  const fontScale = Math.min(
    Math.floor((1.1 * width) / domainName.length),
    Math.floor((1.1 * width) / 15)
  )

  const barHeight = {
    height: (0.13 * width + 0.4 * fontScale).toString() + 'px'
  }
  const aliasMarginTop = {
    marginTop: (0.02 * width - 0.1 * fontScale).toString() + 'px'
  }
  const aliasFontSize = { fontSize: fontScale.toString() + 'px' }

  return (
    <div className={styles.wrapper}>
      <div className={styles.cutOverflow} style={barHeight}>
        <div className={styles.bar} style={barHeight} />
      </div>
      <div
        className={styles.domain}
        style={aliasMarginTop}
        onClick={() => {
          history.push('/')
        }}
      >
        <span className={styles.alias} style={aliasFontSize}>
          {state.alias}
        </span>
        <span className={styles.ext} style={aliasFontSize}>
          {state.extension}
        </span>
      </div>
      <div className={styles.spacer} />
    </div>
  )
}
