import React from 'react'
import styles from './Switch.module.css'

/**
 * Selection menu.
 * choices - Array of selection choices to choose from
 * initialIndex - index of the initially selected choice (1st by default, or 0) *
 * onClick - pass clicking event to use
 */
export const Switch = (props: any) => {

  const [ selection, setSelection ] = React.useState()

  const defaultChoices = [
    { value: true,    display: 'yes',   do: () => { console.log('default true chosen') } },
    { value: false,   display: 'no',    do: () => { console.log('default false chosen') } }
  ]
  const choices: Array<any> = props.choices || defaultChoices

  if (selection === undefined) {
    const initialIndex = props.initialIndex || 0
    setSelection(initialIndex)
    const initialValue = choices[initialIndex].value
    console.log(initialIndex, initialValue, choices)
    if (choices[initialIndex].do) choices[initialIndex].do(initialValue)
  }

  return (
    <div
      className={ [styles.wrapper, props.className].join(' ') }
    >
      <div className={ styles.shiftRight }>
        <div className={ styles.label }>
          { props.thisInputLabel || ''}
        </div>
        <div className={ styles.choiceArea }>
          { choices.map((thisChoice: any, index: number) => (

            <div
              key={ index }

              className={ [
                styles.choice,
                selection === index ? styles.selected : ''
              ].join(' ') }

              onClick={ (e) => {
                // change local state of selection
                setSelection(index)
                // do the corresponding action
                if (thisChoice.do) thisChoice.do(thisChoice.value)
                // do other stuff passed in onClick
                if (props.onClick) props.onClick(e)

                console.log('', thisChoice.display || String(thisChoice.value), 'chosen')
              } }
            >

              { thisChoice.display || String(thisChoice.value) }

            </div>
          )) }
        </div>
      </div>
    </div>
  )
}
