import React from 'react'
import { Store } from '../../store/'
import { CreateHeader } from './../CreateSteps/CreateHeader'
import { P1RestoreOrBackup } from '../CreateSteps/P1RestoreOrBackup'
import { P2LoadWallet } from '../CreateSteps/P2LoadWallet'
import { P3DomainAndWallet } from '../CreateSteps/P3DomainAndWallet'
import { P4ActionChoice } from '../CreateSteps/P4ActionChoice'
import { P5CustomForwards } from '../CreateSteps/P5CustomForwards'
import { P6Broadcast } from './../CreateSteps/P6Broadcast'
import styles from './CreateNavigator.module.css'

/**
 * Handle navigation of alias manipulation
 */
export const CreateNavigator = () => {
  // global state
  const { state } = React.useContext(Store)

  const page = state.pageInfo?.current

  !page && console.log('Unknown Page')

  return (
    <>
      <CreateHeader />
      <div className={ [styles.wrapper, 'scrollbar'].join(' ') }>
        <div className={ styles.horizontalScaler } >
          { (page === 1) && <P1RestoreOrBackup /> }
          { (page === 2) && <P2LoadWallet /> }
          { (page === 3) && <P3DomainAndWallet /> }
          { (page === 4) && <P4ActionChoice /> }
          { (page === 5) && <P5CustomForwards /> }
          { (page === 6) && <P6Broadcast /> }
        </div>
      </div>
    </>
  )
}
