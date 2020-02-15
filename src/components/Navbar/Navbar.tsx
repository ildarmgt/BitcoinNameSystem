import React from 'react'
import { Store } from './../../store'
import { Link, useHistory } from 'react-router-dom'
import styles from './Navbar.module.css'

export const Navbar = (): JSX.Element => {
  // global state
  const { state } = React.useContext(Store)

  // local state for showing collapsed menu
  const [ menu, setMenu ] = React.useState({ show: false })


  const isCreatePage = useHistory().location.pathname === '/create'
  const isHomePage = useHistory().location.pathname === '/'
  const isAboutPage = useHistory().location.pathname === '/about'
  const isSettingsPage = useHistory().location.pathname === '/settings'
  const isWalletPage = useHistory().location.pathname === '/wallet'






  return (
    <>
      <div
        className={ styles.warning }
      >
        not reviewed for use
      </div>

      <div
        className={ styles.nav }
      >
        {/* only show page number in create path */}
        { isCreatePage && (
          <div className={ styles.pageNum }>
            { state.pageInfo.current }/6
          </div>
        ) }

        <div className={ styles.rightButtonsWrapper }>

          <div
            className={ [
              styles.collapsitron,
              styles.button,
              menu.show ? styles.menuShown : ''
            ].join(' ') }
            onClick={ () => {
              setMenu({ ...menu, show: !menu.show })
            } }
          >
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <div className={ styles.dots }><div /></div>
          </div>


          <Link
            className={ isWalletPage ? styles.selected : '' }
            to='/wallet'
          >
            wallet
          </Link>


          <Link
            className={ isSettingsPage ? styles.selected : '' }
            to='/settings'
          >
            settings
          </Link>

          <a
            href="https://github.com/ildarmgt/BitcoinNameSystem"
            target="_blank"
            rel="noopener noreferrer"
          >
            &lt;{ 'source' }&gt;
          </a>

          <Link
            className={ isAboutPage ? styles.selected : '' }
            to='/about'
          >
            about
          </Link>

          <Link
            className={ isCreatePage ? styles.selected : '' }
            to='/create'
          >
            owners
          </Link>

          <Link
            className={ isHomePage ? styles.selected : '' }
            to='/'
          >
            search
          </Link>
        </div>
      </div>
    </>
  )
}

// Hash history cannot PUSH the same path; a new entry will not be added to the history stack
// Only issue is the warning in console, but that only exists in development mode so can be ignored.