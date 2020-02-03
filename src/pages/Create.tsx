import React from 'react'
import { CreateHeader } from './../components/CreateSteps/CreateHeader'
import { CreateNavigator } from './../components/CreateNavigator'

/**
 * Combine header & body components for alias manipulation
 */
export default function Create () {
  return (
    <>
      <CreateHeader />
      <CreateNavigator />
    </>
  )
}
