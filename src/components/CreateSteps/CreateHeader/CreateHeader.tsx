import React, { useEffect, useState } from 'react'
import styles from './CreateHeader.module.css'
import { Store } from './../../../store/'



// restore backup or create new
export const CreateHeader = () => {
  const { state } = React.useContext(Store) // global state

  // get window width in component instance state 'width'
  // so can resize alias based on char count
  const [ width, setWidth ] = useState(window.innerWidth)
  useEffect(() => {
    const resize = () => { setWidth(window.innerWidth) }
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [])
  const domainName = state.alias + state.extension
  const fontScale = Math.min(
      Math.floor(1.3 * width / domainName.length),
      Math.floor(1.3 * width / 20)
  )

  return (
    <>
      <div
        className={ styles.bar }
        style={{ top: (-0.10 * width - 0.4 * fontScale).toString() + 'px' }}
      />
      <div
        className={ styles.wrapper }
        style={{ marginTop: (0.03 * width - 0.3 * fontScale).toString() + 'px' }}
      >
        <span
          className={ styles.alias }
          style={{ fontSize: fontScale.toString() + 'px' }}
        >{ state.alias }</span>
        <span
          className={ styles.ext }
          style={{ fontSize: fontScale.toString() + 'px' }}
        >{ state.extension }</span>
      </div>
      <div className={ styles.spacer } />
    </>
  )
}

