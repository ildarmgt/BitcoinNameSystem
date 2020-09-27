import React from 'react'
import styles from './SettingsContent.module.css'
import { Switch } from './../general/Switch'
import { InputForm } from './../general/InputForm'
import { Store } from './../../store'
import { ActionTypes } from './../../interfaces'

export const SettingsContent = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  return (
    <div className={[styles.wrapper, 'scrollbar'].join(' ')}>
      <div className={styles.contentWrapper}>
        <div className={styles.title}>Settings</div>
        Subject to changes until beta. <br />
        Not yet reviewed: high chance of bugs and losses. <br />
        <div>
          Network:
          <Switch
            choices={[
              {
                value: 'testnet',
                do: () => {
                  dispatch({
                    type: ActionTypes.LOAD_STATE,
                    payload: { ...state, network: 'testnet' }
                  })
                }
              },
              {
                value: 'mainnet',
                do: () => {
                  dispatch({
                    type: ActionTypes.LOAD_STATE,
                    payload: { ...state, network: 'bitcoin' }
                  })
                }
              }
            ]}
          />
        </div>
        <InputForm
          style={{ width: '80%' }}
          thisInputLabel={'Path for full node with esplora API'}
          thisInitialValue={state.api.path[state.network]}
          showBonusInformation={'true'}
          sanitizeFilters={['url']}
          thisSubmitButtonOnClick={(textValue: string) => {
            state.api.path[state.network] = textValue
            console.log('click set value to ', textValue)
            dispatch({
              type: ActionTypes.LOAD_STATE,
              payload: { ...state }
            })
          }}
        >
          {state.network} : {state.api.path[state.network]}
        </InputForm>
        <br />
        {/* <div>
          Automatically save data to browser (local storage) ? (todo)
          <br />
          <Switch choices={[{ value: 'not allow' }, { value: 'allow' }]} />
        </div>
        <div>
          (if yes) Provide a password to encrypt local storage <br />
          with to hide it from other applications (todo)
          <br /> [todo textbox form]
        </div> */}
      </div>
    </div>
  )
}
