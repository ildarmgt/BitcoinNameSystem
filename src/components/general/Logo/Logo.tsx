import React from 'react'
import styles from './Logo.module.css'

/**
 * Bitcoin Logo.
 */
export const Logo = (props: any) => {
  if (props.size) {
  }

  return (
    <div
      className={styles.outershell2}
      {...props}
      style={{
        ['--u']: props.size ? props.size.toString() : 'calc(0.5vw + 0.5vh)'
      }}
    >
      <div className={styles.wrapper2}>
        <div className={styles.rotater2}>
          <div className={styles.logo2}>
            <span>B</span>
          </div>
        </div>
      </div>
    </div>
  )
}
