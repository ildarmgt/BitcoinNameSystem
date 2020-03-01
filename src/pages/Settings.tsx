import React from 'react'
import { Switch } from './../components/general/Switch'
import { InputForm } from './../components/general/InputForm'
import { Store } from '../store/'
import { ActionTypes } from './../interfaces/'

/**
 * Settings path page. (temporarily used for testing)
 */
export const Settings = (props: any): JSX.Element => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  return (
    <>
      <br />
      <br />
      <div>Settings</div>
      <br />
      <div>(todo)</div>
      <br />
      subject to changes until launch
      <br />
      high chance of bugs and losses, especially until reviewed
      <br />
      <br />
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
      <br />
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
      <br />
      <div>
        Automatically save data to browser (local storage) ? (todo)
        <br />
        <Switch choices={[{ value: 'not allow' }, { value: 'allow' }]} />
      </div>
      <div>
        (if yes) Provide a password to encrypt local storage <br />
        with to hide it from other applications (todo)
        <br /> [todo textbox form]
      </div>
    </>
  )
}
