import React from 'react'
import { Withdraw } from './../components/wallet/Withdraw'

const Home = (props: any): JSX.Element => {
  return (
    <>
      <Withdraw { ...props } />
    </>
  )
}
export default Home