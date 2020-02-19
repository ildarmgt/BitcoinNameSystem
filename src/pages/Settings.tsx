import React from 'react'
import { Switch } from './../components/general/Switch'
import { Store } from './../store/'
import { ActionTypes } from './../interfaces/'

export const Settings = (props: any): JSX.Element => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  return (
    <>
    <br /><br />
      <div>Settings</div>
      <br />
      <div>(todo)</div>
      <br />
      subject to changes until launch
      <br />
      high chance of bugs and losses, especially until reviewed
      <br /><br />

      <div>
        Network:
        <Switch
          choices={ [
            { value: 'testnet', do: () => { dispatch({ type: ActionTypes.LOAD_STATE, payload: { ...state, network: 'testnet' } }) }},
            { value: 'mainnet', do: () => { dispatch({ type: ActionTypes.LOAD_STATE, payload: { ...state, network: 'bitcoin' } }) } }
          ] }
        />


      </div>

      <br /> <br />
      <div>
        Automatically save data to browser (local storage) ? (todo)<br />
        <Switch
          choices={ [{ value: 'not allow'}, { value: 'allow' }] }
        />
      </div>
      <div>
        (if yes) Provide a password to encrypt local storage <br />with to hide it from other applications (todo)
        <br /> [textbox form]
      </div>
    </>
  )
}