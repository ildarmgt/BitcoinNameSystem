import React from 'react'
import styles from './UserInterface.module.css'

export const UserInterface = () => {
  return (
    <div className={styles.wrapper}>
      <div>Options</div>
      <div>Key Storage</div>
      <div>Send</div>
      <div>Send (stealth)</div>
      <div>Receive</div>
    </div>
  )
}
