import React from 'react'
import styles from './SettingsContent.module.css'
import { Switch } from './../general/Switch'
import { InputForm } from './../general/InputForm'
import { Store } from './../../store'
import { changeSettingsAction } from './../../store/'

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
                  changeSettingsAction(state, dispatch, st => {
                    st.network = 'testnet'
                  })
                }
              },
              {
                value: 'mainnet',
                do: () => {
                  changeSettingsAction(state, dispatch, st => {
                    st.network = 'bitcoin'
                  })
                }
              }
            ]}
            initialIndex={state.network === 'testnet' ? 0 : 1}
          />
        </div>
        <InputForm
          style={{ width: '80%' }}
          thisInputLabel={'Path for a node with esplora API'}
          thisInitialValue={state.api.path[state.network]}
          showBonusInformation={'true'}
          sanitizeFilters={['url']}
          showButton={'true'}
          thisSubmitButtonOnClick={(textValue: string) => {
            changeSettingsAction(
              state,
              dispatch,
              st => {
                st.api.path[state.network] = textValue
              },
              false
            )
            console.log('set API path value to ', textValue)
          }}
        >
          {state.network === 'testnet' ? 'testnet' : 'mainnet'} :{' '}
          {state.api.path[state.network]}
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
