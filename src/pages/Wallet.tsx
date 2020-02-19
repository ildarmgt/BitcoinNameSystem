import React from 'react'
import { Withdraw } from './../components/wallet/Withdraw'

export const Wallet = (props: any): JSX.Element => {
  return (
    <>
      <Withdraw { ...props } />
    </>
  )
}
