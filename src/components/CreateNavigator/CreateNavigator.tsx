import React from 'react'
import { Store } from '../../store/'
import { CreateHeader } from './../CreateSteps/CreateHeader'
import { PageConnectToWallet } from '../CreateSteps/PageConnectToWallet'
import { P2LoadWallet } from '../CreateSteps/P2LoadWallet'
import { P3DomainAndWallet } from '../CreateSteps/P3DomainAndWallet'
import { P4ActionChoice } from '../CreateSteps/P4ActionChoice'
import { P5CustomForwards } from '../CreateSteps/P5CustomForwards'
import { P6Broadcast } from './../CreateSteps/P6Broadcast'
import styles from './CreateNavigator.module.css'

/**
 * Handle navigation of alias controlling app
 *
 * App pages
 *
 * 1. connect wallet page (skip if already connected)
 *      open wallet to fill in mneumonic & pin & funding options
 *      scan to confirm address & totals
 *      scan to confirm domain
 *      confirm
 *
 * 2. show action choices that address can do with that domain
 *
 * 3. give option to add/edit forwards
 *
 * 4. show goal tx summary
 *    send to wallet to authorize signing via pin
 *    broadcast
 *
 */
export const CreateNavigator = () => {
  // global state
  const { state } = React.useContext(Store)

  const page = state.pageInfo?.current

  !page && console.log('Unknown Page')

  return (
    <>
      <div className={[styles.wrapper].join(' ')}>
        <CreateHeader />
        <div className={[styles.scroller, 'scrollbar'].join(' ')}>
          <div className={[styles.horizontalScaler].join(' ')}>
            {page === 1 && <PageConnectToWallet />}
            {page === 2 && <P2LoadWallet />}
            {page === 3 && <P3DomainAndWallet />}
            {page === 4 && <P4ActionChoice />}
            {page === 5 && <P5CustomForwards />}
            {page === 6 && <P6Broadcast />}
          </div>
        </div>
      </div>
    </>
  )
}
