import React from 'react'
import styles from './RoundButton.module.css'

/**
 * Standard button for this app.
 *
 * Pass the following props to customize it.
 *
 * next='true' to add next arrow at right (off if undefined or '').
 *
 * back='true' to add back arrow on left (off if undefined or '').
 *
 * minor='true' to just color it like a minor button (like back button) w/o arrow.
 *
 * show='true' to display element vs show='false' to set display to none (dom still exists).
 *
 * showdisabled='true' to make button unclickable and grayed out
 *
 * sizebutton='2.9' to make the button size 2.9x standard var(--s) size used (defined in global global.css).
 *
 * colorbutton='var(--colorBitcoinOrange)' to customize color.
 *
 * colorbuttonText='var(--colorButtonText)' to customize text color.
 *
 * -------------------------------------------------
 * Defaults (vars defined in global global.css):`
 *
 * sizebutton = 2.5. ( means font size calc(2.5/2.9 * var(--s)) )
 *
 * colorbutton = var(--colorBitcoinOrange).
 *
 * colorbuttontext = var(--colorButtonText).
 */
export const RoundButton = (props: any): JSX.Element => {
  // styles.roundButtonWrap on outside
  return (
    <div
      // variables defined by string will be available to button & its children for scope
      style={{
        display: (props?.show === 'false'
          ? 'none'
          : 'inline-block') as React.CSSProperties,
        '--colorThisButton': (props.colorbutton
          ? props.colorbutton
          : `var(--colorBitcoinOrange)`) as React.CSSProperties,
        '--colorThisButtonText': (props.colorbuttontext
          ? props.colorbuttontext
          : `var(--colorButtonText)`) as React.CSSProperties,
        '--sizeButton': (props.sizebutton
          ? // Button was designed at 2.9 * var(--s) scale font so
            // this just lets user redefine font & everything else proportionally
            `calc(${props.sizebutton}/2.9 * var(--s))`
          : `calc(2.5/2.9 * var(--s))`) as React.CSSProperties
      }}
      {...props}
      className={[
        styles.roundButtonWrap,
        props.back ? styles.backWrapper : '',
        props.minor ? styles.minorWrapper : undefined,
        props.showdisabled ? styles.disabledWrap : undefined,
        props.className
      ].join(' ')}
      onClick={e => {
        // do not process click if showdisabled is on
        if (!props.showdisabled) props.onClick(e)
      }}
    >
      <div
        className={[
          styles.roundButton,
          props.back ? styles.backArrowPad : undefined,
          props.next ? styles.nextArrowPad : undefined,
          props.minor ? styles.minorButton : undefined,
          props.showdisabled ? styles.disabled : undefined
        ].join(' ')}
      >
        {props.back && <div className={styles.backArrow} />}

        {props.children}

        {props.next && <div className={styles.nextArrow} />}

        <div className={styles.overhead} />
      </div>
    </div>
  )
}
