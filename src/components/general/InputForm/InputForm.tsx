import React from 'react'
import styles from './InputForm.module.css'
import { RoundButton } from './../../general/RoundButton'
import sanitize from '../../../helpers/sanitize'

/**
 * Reusable and styled form, label, textarea.
 * Component is internally a controlled component, but externally uncontrolled.
 * value is kept in text form, but can provide thisInputOnChange to optionally store it in another form elsewhere.
 * value is read internally, but initial value can be set with thisInitialValue
 *
 * props:
 * thisInputLabel - label.
 * thisInitialValue - initial value.
 * thisInputOnChange - function to do onChange.
 * sanitizeFilters - sanitize filters, default is single line.
 * showButton - show ok button or not.
 * thisSubmitButtonOnClick - function to run on OK clicked.
 * showBonusInformation - show what's b/w <InputForm> & </InputForm> under the text area.
 * placeholder - text to show as placeholder in text area.
 */
export const InputForm = (props: any) => {
  // local state so can edit / store textbox content without having
  // to read from final state which might be a number or further sanitized
  const [textValue, setTextValue]: [string | undefined, any] = React.useState()

  if (textValue === undefined) {
    if (props.thisInputOnChange)
      props.thisInputOnChange({
        target: { value: props.thisInitialValue || '' }
      })
  }

  React.useEffect(() => {
    setTextValue(props.thisInitialValue || '')
  }, [props.thisInitialValue])

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      className={[styles.wrapper, props.className].join(' ')}
      style={props.style}
    >
      <div className={styles.shiftRight}>
        <aside className={styles.label}>{props.thisInputLabel || ''}</aside>
        <textarea
          className={styles.textarea}
          wrap={'off'}
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
          placeholder={props.placeholder || ''}
        ></textarea>
        {props.showButton === 'true' && (
          <RoundButton
            className={[styles.button].join(' ')}
            next={'true'}
            onClick={() => {
              if (props.thisSubmitButtonOnClick)
                props.thisSubmitButtonOnClick(textValue)
            }}
          >
            OK
          </RoundButton>
        )}
        {!!props.showBonusInformation && (
          <div className={styles.bonusInformation}>{props.children}</div>
        )}
      </div>
    </div>
  )
}
