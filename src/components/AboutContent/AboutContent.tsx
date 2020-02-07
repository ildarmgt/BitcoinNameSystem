import React from 'react'
import { Store } from './../../store/'
import styles from './AboutContent.module.css'

export const AboutContent = () => {
  const { state } = React.useContext(Store)

  return (
    <>
      <div className={ styles.wrapper }>
        <div>
          About page (TODO)
        </div>
        <pre>
          { JSON.stringify({ ...state }, null, 2) }
        </pre>
      </div>
    </>
  )
}
