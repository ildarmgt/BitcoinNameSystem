import React from 'react'
import styles from './InputForm.module.css'
import { RoundButton } from './../../general/RoundButton'
import sanitize from '../../../helpers/sanitize'

/**
 * Reusable and styled form, label, textarea.
 * Component is internally a controlled component, but externally uncontrolled.
 * value is kept in text form, but can provide thisInputOnChange to optionally store it in another form elsewhere.
 * value is read internally, but initial value can be set with thisInitialValue
 */
export const InputForm = (props: any) => {
  // local state so can edit / store textbox content without having
  // to read from final state which might be a number or further sanitized
  const [textValue, setTextValue] = React.useState()

  if (textValue === undefined) {
    if (props.thisInputOnChange)
      props.thisInputOnChange({
        target: { value: props.thisInitialValue || '' }
      })
  }

  React.useEffect(() => {
    setTextValue(props.thisInitialValue || '')
  }, [props.thisInitialValue])

  return (
    <div
      className={[styles.wrapper, props.className].join(' ')}
      style={props.style}
    >
      <div className={styles.shiftRight}>
        <aside className={styles.label}>{props.thisInputLabel || ''}</aside>
        <textarea
          className={styles.textarea}
          spellCheck={false}
          value={
            // read what we see in the textarea
            textValue
            // props.thisInputValue
          }
          onChange={(e?: any) => {
            // set what we see in the textarea after removing unwanted chars like nextline
            const cleanedValue = sanitize(
              e.target.value,
              props.sanitizeFilters || ['oneline']
            )
            setTextValue(cleanedValue)
            // update value so it's single line for custom change function below if any
            e.target.value = cleanedValue

            // furthermore, run user provided setter
            if (props.thisInputOnChange) props.thisInputOnChange(e)
          }}
        ></textarea>
        <RoundButton
          className={[
            styles.button,
            props.showButton === 'false' ? styles.invisible : ''
          ].join(' ')}
          next={'true'}
          onClick={(e: any) => {
            props.thisSubmitButtonOnClick
              ? props.thisSubmitButtonOnClick(textValue)
              : (() => {})()
          }}
        >
          OK
        </RoundButton>
        {!!props.showBonusInformation && (
          <div className={styles.bonusInformation}>{props.children}</div>
        )}
      </div>
    </div>
  )
}
