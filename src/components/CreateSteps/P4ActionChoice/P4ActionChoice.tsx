import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ActionChoice.module.css'
import { Store } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'

import { runAllActionPermissionChecks, calcBnsState } from './../../../helpers/bns/'


/**
 * Bid on network
 */
export const P4ActionChoice = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)


  // simulate bns state once again just in case
  // up to current block height
  const bns = calcBnsState(
    state.domain.txHistory,
    state.domain.domainName,
    state.chain.height,
    state.network
  )
  // and get all permissions
  const checkActions = runAllActionPermissionChecks(bns, state.wallet.address)

  // console.log('checkActions', checkActions())

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Choose an available action
      </div>
      <div className={ styles.contentWrapper }>
        <div>
          Allowed actions
        </div>
        <div>
        {
          checkActions.map(action => {
            if (action.isUsable) {
              return (
              <RoundButton
                key={ action.info }
              >
                { action.info }
              </RoundButton>
              )
            } else {
              return ''
            }
          })
        }
        </div>
        <div>
          Unavailable actions
        </div>
        <div>
        {
          checkActions.map(action => {
            if (!action.isUsable) {
              return (
                <div
                  key={action.info}
                >
                  <div>
                    { action.info }
                  </div>
                  <div>
                    { action.permissionList.map((permission: any) => {
                      return (
                        <div
                          key={permission.info}
                        >
                          * { permission.info } : { permission.isAllowed ? 'passed' : 'failed' }
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            } else {
              return ('')
            }
          })
        }
        </div>
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
      </div>
    </div>
  )
}