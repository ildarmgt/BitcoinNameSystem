import React from 'react'
import styles from './Logo.module.css'

/**
 * Bitcoin Logo.
 */
export const Logo = (props: any) => {
  return (
    <div
      className={[styles.outershell2, props.className].join(' ')}
      style={
        {
          '--btcLogoInputSize': props.size
            ? props.size.toString()
            : 'calc(10 * (0.5vw + 0.5vh))'
        } as React.CSSProperties
      }
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
