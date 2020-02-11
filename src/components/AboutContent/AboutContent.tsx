import React from 'react'
// import { Store } from './../../store/'
import styles from './AboutContent.module.css'
import { ReactComponent as Drawing } from './graphic.svg'


export const AboutContent = () => {
  // const { state } = React.useContext(Store)

  return (
    <>
      <div className={ [styles.wrapper, 'scrollbar'].join(' ') }>
        <div className={ styles.title }>
          Your <span>Bitcoin</span> domain
          &nbsp;&nbsp;=&nbsp;&nbsp;
          infinite forwarding addresses
        </div>

        <div className={ styles.contentWrapper }>


          <Drawing
            className={ styles.drawing }
          />

          <p>
            <span>Bitcoin</span> Domain System (<b>BNS</b>): On-Bitcoin-chain DNS where easy to read domain name (i.e. alias) can be looked up or created to forward to very long alphanumeric Bitcoin addresses or other types of addreses (e.g. ipfs, https, twitter) on the most secure public permissionless network ever created.


          <a
            href="https://github.com/ildarmgt/BitcoinNameSystem/blob/master/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            README.md on github
          </a>
          </p>


        </div>


      </div>
    </>
  )
}
