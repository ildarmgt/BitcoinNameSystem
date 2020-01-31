import React from 'react'
import { Store } from './../../store/'
import { P1RestoreOrBackup } from '../CreateSteps/P1RestoreOrBackup'
import { P2LoadWallet } from '../CreateSteps/P2LoadWallet'
import { P3DomainAndWallet } from '../CreateSteps/P3DomainAndWallet'
import { P4ClaimDomain } from '../CreateSteps/P4ClaimDomain'
import styles from './CreateNavigator.module.css'

/**
 * Handle navigation of alias manipulation
 */
export const CreateNavigator = () => {
  const { state } = React.useContext(Store) // global state

  const page = state.pageInfo?.current
  return (
    <div className={ [styles.wrapper, 'scrollbar'].join(' ') }>
      { (page === 1) && <P1RestoreOrBackup /> }
      { (page === 2) && <P2LoadWallet /> }
      { (page === 3) && <P3DomainAndWallet /> }
      { (page === 4) && <P4ClaimDomain /> }

      { (!page) && console.log('Unknown Page') }
    </div>
  )
}
