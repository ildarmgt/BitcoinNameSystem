import React from 'react'
import { AboutContent } from './../components/AboutContent'

export function About(): JSX.Element {
  return (
    <>
      <AboutContent />
    </>
  )
}

// for lazy loading:
// const RoundButton = React.lazy<any>(() => import('../components/RoundButton')
// <React.Suspense
//   fallback={
//     <div>loading...</div>
//   }
// >
// </React.Suspense>
