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
        props.size
          ? ({
              '--btcLogoInputSize': props.size.toString()
            } as React.CSSProperties)
          : {}
      }
    >
      <div className={[styles.btcLogo, styles.cutoffs].join(' ')}>
        <div className={[styles.btcLogo, styles.background].join(' ')}></div>
        <div className={[styles.btcLogo, styles.theB].join(' ')}>B</div>
      </div>
    </div>
  )
}
