import React from 'react'
import styles from './InputForm.module.css'
import { RoundButton } from './../../general/RoundButton'
import sanitize from '../../../helpers/sanitize'

const TIME_DELAY_BEFORE_SEARCH = 1000 // ms

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
  const [textValue, setTextValue]: [string, any] = React.useState(
    props.thisInitialValue !== undefined ? props.thisInitialValue : ''
  )

  // store look up table and time delay for it
  const [dropdowns, setDropdowns]: any = React.useState({
    lastTimer: null,
    known: {}
  })

  // const [note, setNote]: any = React.useState('')

  // store if text area has focus (for drop down)
  const [hasFocus, setHasFocus]: any = React.useState(false)

  const handleChange = (e?: any) => {
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

    // check dropdown once stopped typing long enough
    // clear old timer, set new timer
    if (props.getDropdowns) {
      clearTimeout(dropdowns.lastTimer)
      const newTimer = setTimeout(async () => {
        // look up previously searched string, otherwise use the function to search it
        if (!dropdowns.known[cleanedValue]) {
          // if have to look it up first time
          const items = (await props.getDropdowns(cleanedValue)) || []
          // add whatever it is to look up table
          if (items.length)
            setDropdowns({
              ...dropdowns,
              known: {
                ...dropdowns.known,
                [cleanedValue]: items
              }
            })
        }
      }, TIME_DELAY_BEFORE_SEARCH)
      setDropdowns({ ...dropdowns, lastTimer: newTimer })
    }
  }

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
          onFocus={() =>
            setTimeout(async () => {
              setHasFocus(true)
            }, TIME_DELAY_BEFORE_SEARCH / 4)
          }
          onBlur={() =>
            setTimeout(async () => {
              setHasFocus(false)
            }, TIME_DELAY_BEFORE_SEARCH / 4)
          }
          className={styles.textarea}
          wrap={'off'}
          spellCheck={false}
          value={
            // read what we see in the textarea
            textValue
            // props.thisInputValue
          }
          onChange={handleChange}
          // onKeyDown={handleChange}
          placeholder={props.placeholder || ''}
        ></textarea>
        {/* show suggestions when text area is in focus, delay, and there are results */}
        {props.getDropdowns &&
          props.renderDropdowns &&
          hasFocus &&
          dropdowns.known[textValue] && (
            <div className={[styles.suggestions, 'scrollbar'].join(' ')}>
              {(dropdowns.known[textValue] || []).map(
                (item: any, index: number) => {
                  // fill in the string
                  const handleClick = (newValue: string) => {
                    setTextValue(newValue)
                    handleChange({ target: { value: newValue } })
                  }
                  const renderDropdowns = props?.renderDropdowns({
                    textValue,
                    item
                  })
                  return !renderDropdowns ? (
                    undefined
                  ) : (
                    <div key={`suggestion_dropdown_${index}`}>
                      <div
                        className={[
                          styles.suggestions__item,
                          'letter_breakable'
                        ].join(' ')}
                        onClick={() => handleClick(renderDropdowns.selection)}
                      >
                        {renderDropdowns.contents}
                      </div>

                      <div className={styles.suggestions__separator}></div>
                    </div>
                  )
                }
              )}
            </div>
          )}
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

// if (textValue === undefined) {
//   if (props.thisInputOnChange)
//     props.thisInputOnChange({
//       target: {
//         value:
//           props.thisInitialValue !== undefined ? props.thisInitialValue : ''
//       }
//     })
// }

// React.useEffect(() => {
//   setTextValue(
//     props.thisInitialValue !== undefined ? props.thisInitialValue : ''
//   )
// }, [props.thisInitialValue])
