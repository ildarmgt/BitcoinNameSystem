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
          <div>
            Your <span>Bitcoin</span> domain
            &nbsp;=&nbsp;
          </div>
          <div>
            &nbsp;infinite forwarding addresses
          </div>
        </div>

        <div className={ styles.contentWrapper }>

          <Drawing
            className={ styles.drawing }
          />

          <p>
            <span>Bitcoin</span> Domain System (<span>BNS</span>): easy to read custom domain names (i.e. aliases) that can store unlimited forwarding information to long alphanumeric btc addresses or any other types of addreses (e.g. ipfs, https, twitter, ...).
          </p>

          <p>
            All <span>BNS</span> data is stored inside transactions on the <span>Bitcoin</span> blockchain. This means that <span>BNS</span> is protected by the most secure, decentralized, permissionless, and censorship resistant public network ever created.
          </p>

          <a
            href="https://github.com/ildarmgt/BitcoinNameSystem/blob/master/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            README on github
          </a>

        </div>


      </div>
    </>
  )
}
