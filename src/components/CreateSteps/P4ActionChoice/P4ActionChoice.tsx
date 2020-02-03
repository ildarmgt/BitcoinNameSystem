import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ActionChoice.module.css'
import { Store } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'

/**
 * Bid on network
 */
export const P4ActionChoice = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Choose an available action
      </div>
      <div className={ styles.contentWrapper }>
        
      </div>
      <div className={ styles.buttonWrapper }>
        <RoundButton
          back='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 3)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          next='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 5)
          }}
        >
          Ready
        </RoundButton>
      </div>
    </div>
  )
}