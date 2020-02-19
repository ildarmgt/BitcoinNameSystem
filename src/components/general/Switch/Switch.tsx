import React from 'react'
import styles from './Switch.module.css'

/**
 * Selection menu.
 * choices - Array of selection choices to choose from
 * initialIndex - index of the initially selected choice (1st by default, or 0) *
 * onClick - pass clicking event to use
 */
export const Switch = (props: any) => {

  const [ selection, setSelection ] = React.useState(props.initialIndex || 0)

  const defaultChoices = [
    { value: true,    do: () => { console.log('true chosen') } },
    { value: false,   do: () => { console.log('false chosen') } }
  ]
  const choices: Array<any> = props.choices || defaultChoices

  return (
    <div
      className={ [styles.wrapper, props.className].join(' ') }
    >
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
                if (thisChoice.do) thisChoice.do()
                // do other stuff passed in onClick
                if (props.onClick) props.onClick(e)

                console.log('', String(thisChoice.value), 'chosen')
              } }
            >

              { String(thisChoice.value) }

            </div>

        )) }
      </div>
    </div>
  )
}
