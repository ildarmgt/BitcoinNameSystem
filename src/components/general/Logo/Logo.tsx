import React from 'react'
import styles from './Logo.module.css'

/**
 * Bitcoin Logo
 */
export const Logo = (props: any) => {
  return (
    <div {...props}>
      <div className={styles.wrapper}>
        <div className={styles.logo}>
          <span>₿</span>
        </div>
      </div>
    </div>
  )
}
