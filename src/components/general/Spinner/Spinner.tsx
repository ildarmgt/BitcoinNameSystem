import React from 'react'
import styles from './Spinner.module.css'

export const Spinner = (props: any): JSX.Element => {
  return (
    <div
      className={[styles.spinner, props.className].join(' ')}
      style={
        {
          '--widthSpinner': props.width ? props.width : `20vw`
        } as React.CSSProperties
      }
    >
      <div className={styles.block}></div>
      <div className={styles.chain}></div>
    </div>
  )
}
