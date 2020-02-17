import React from 'react'
import styles from './InputForm.module.css'
import { RoundButton } from './../../general/RoundButton'

/**
 * Reusable and styled form, label, textarea.
 */
export const InputForm = (props: any) => {
  // const [showThis, setShowThis] = React.useState(false)

  return (
    <div
      className={ [styles.wrapper, props.className].join(' ') }
      style={ props.style }
    >
      <div className={ styles.shiftRight }>
        <aside className={ styles.label }>
          { props.thisInputLabel || '' }
        </aside>
        <textarea
          className={ styles.textarea }
          spellCheck={ false }
          value={ props.thisInputValue || '' }
          placeholder={ props.thisInputPlaceholder || '' }
          onChange={ (e?: any) => {
            props.thisInputOnChange ? props.thisInputOnChange(e) : (()=>{})()
          } }
        ></textarea>
        <RoundButton
          className={ styles.button }
          next={ 'true' }
          onClick={ (e?: any) => {
            props.thisSubmitButtonOnClick ? props.thisSubmitButtonOnClick(e) : (()=>{})()
          } }
        >
          OK
        </RoundButton>
        <div className={ styles.bonusInformation }>
          { props.children }
        </div>
      </div>
    </div>
  )
}
