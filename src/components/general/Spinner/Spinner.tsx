import React from 'react'
import styles from './Spinner.module.css'

export const Spinner = (props: any): JSX.Element => {
  return (
    <div
      className={[styles.spinner, props.className].join(' ')}
      style={
        props.width
          ? ({
              '--widthSpinner': props.width
            } as React.CSSProperties)
          : {}
      }
    >
      <div className={styles.block}></div>
      <div className={styles.chain}></div>
    </div>
  )
}
