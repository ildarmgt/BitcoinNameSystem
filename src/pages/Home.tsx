import React from 'react'
import { HomeContent } from './../components/HomeContent'

const Home = (props: any): JSX.Element => {
  return (
    <>
      <HomeContent { ...props } />
    </>
  )
}
export default Home