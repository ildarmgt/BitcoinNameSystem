import React from 'react'
import styles from './Details.module.css'

/**
 * Create details expanding/collapsing button.
 * Optional props:
 * title={ 'random text' } to change text shown on the hide/show toggle button
 * show={ 'true } to show initially *
 * Background is automatically styled if <p></p> is used directly inside.
 * If so, <span></span> can be used inside <p></p> to separate
 * paragraphs and indent the wrap as well.
 */
export const Details = (props: any) => {
  // local state for showing or hiding details
  const [ showDetails, setShowDetails ] = React.useState(props?.show === 'true' || false)

  return (
    <div className={ styles.wrapper }>

      {/* button that toggles whether details are shown or not */}
      <div
        className={ styles.buttonWrapper }
        onClick={ () => {
          setShowDetails(!showDetails)
        } }
      >
        <div
          className={ styles.toggleDetails }

        >
          {/* the text on button coems from title prop */}
          { props.title || props.description || 'Show details' }
          </div>
        {/* the arrow that rotates on click */}
        <div
          className={ [styles.arrow, showDetails ? styles.down : '' ].join(' ') }
        />
        </div>


      {/* the details that is rendered when showDetails = true */}
      <div
        className={ styles.details }
        style={ {
          display: (
            showDetails ? 'block' : 'none'
          )
        } }
      >
        {/* any arbitrary content surrounded by this component brackets */}
        {/* if <p></p> tags are used, they will be formated */}
        { props.children }
      </div>
    </div>
  )
}
