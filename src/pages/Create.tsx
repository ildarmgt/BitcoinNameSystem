import React from 'react'
import { CreateHeader } from './../components/CreateSteps/CreateHeader'
import { CreateNavigator } from './../components/CreateNavigator'

/**
 * Combine header & body components for alias manipulation
 */
export default function Create () {
  // const verticalShift: React.CSSProperties = {
  //   padding: '0',
  //   margin: '0',
  //   overflowY: 'auto',
  //   height: 'calc(100vh - 17vw - calc(9 * var(--s)))'
  // }

  return (
    <>
      <CreateHeader />
      {/* <div style={verticalShift}> */}
      <CreateNavigator />
      {/* </div> */}
    </>
  )
}
