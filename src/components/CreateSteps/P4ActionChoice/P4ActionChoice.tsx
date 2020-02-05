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

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Available actions
      </div>
      <div className={ styles.availableActions }>
        {
          checkActions.map(action => {
            if (action.isUsable) {
              return (
              <RoundButton
                next={ 'true' }
                onClick={ () => {
                  changePageInfoAction(state, dispatch, 5)
                }}
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
      <div className={ styles.unavailableActions }>
        <div className={ styles.unavailableActions__title }>
          Unavailable actions:
        </div>
        <div className={ styles.unavailableActions__actionList }>
          {
            checkActions.map(action => {
              if (!action.isUsable) {
                return (
                  <div
                    className={
                      styles.unavailableActions__actionList__action
                    }
                    key={ action.info }
                  >
                    <div
                      className={
                        styles.unavailableActions__actionList__action__title
                      }
                    >
                      { action.info }
                    </div>
                    <div
                      className={
                        styles.unavailableActions__actionList__action__permissionList
                      }
                    >
                      { action.permissionList.map((permission: any) => {
                        return (
                          <div
                            className={
                              styles.unavailableActions__actionList__action__permissionList__permission
                            }
                            key={permission.info}
                          >
                            - { permission.info }
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