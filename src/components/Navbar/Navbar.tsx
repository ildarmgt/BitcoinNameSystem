import React from 'react'
import { Store } from './../../store'
import { Link, useHistory } from 'react-router-dom'
import styles from './Navbar.module.css'

export const Navbar = (): JSX.Element => {
  // global state
  const { state } = React.useContext(Store)

  const isCreatePage = useHistory().location.pathname === '/create'
  const isHomePage = useHistory().location.pathname === '/'
  const isAboutPage = useHistory().location.pathname === '/about'

  return (
    <>
      <div
        className={ styles.warning }
      >
        FOR TESTING, DO NOT USE
      </div>
      <div
        className={ styles.root }
      >
        {/* only show page number in create path */}
        { isCreatePage && (
          <div className={ styles.pageNum }>
            { state.pageInfo.current }/6
          </div>
        ) }
        <a
          href="https://github.com/ildarmgt/BitcoinNameSystem"
          target="_blank"
          rel="noopener noreferrer"
        >
          { 'source' }
        </a>
        <Link
          className={ isAboutPage ? styles.selected : '' }
          to='/about'
        >about</Link>
        <Link
          className={ isCreatePage ? styles.selected : '' }
          to='/create'
        >owners</Link>
        <Link
          className={ isHomePage ? styles.selected : '' }
          to='/'
        >search</Link>
      </div>
    </>
  )
}

// Hash history cannot PUSH the same path; a new entry will not be added to the history stack
// Only issue is the warning in console, but that only exists in development mode so can be ignored.