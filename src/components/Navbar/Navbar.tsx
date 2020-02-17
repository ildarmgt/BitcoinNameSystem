import React from 'react'
import { Store } from './../../store'
import { Link, useHistory } from 'react-router-dom'
import styles from './Navbar.module.css'


const MAX_BUTTONS_TO_SHOW_UNCOLLAPSED = 4

export const Navbar = (): JSX.Element => {
  // global state
  const { state } = React.useContext(Store)

  // references for objects of interest
  const searchButton = React.useRef<HTMLDivElement>(null)
  const toggleMenuButtonDiv = React.useRef<HTMLDivElement>(null)
  const overflowMenuDiv = React.useRef<HTMLDivElement>(null)

  // local state for navbar
  const [ nav, setNav ] = React.useState({
    buttonWidth: (!!searchButton.current)
      ? searchButton.current.offsetWidth
      : undefined,
    showCollapsed: false,
    resizeTimer: 0
  })

  // initialize nav bar measurements
  if (!nav.buttonWidth) {
    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }

  // selection rules for buttons
  const isCreatePage = useHistory().location.pathname === '/create'
  const isHomePage = useHistory().location.pathname === '/'
  const isAboutPage = useHistory().location.pathname === '/about'
  const isSettingsPage = useHistory().location.pathname === '/settings'
  const isWalletPage = useHistory().location.pathname === '/wallet'


  React.useEffect(() => {
    // place overflow menu and show it
    const updateMenuPosition = () => {
      if (toggleMenuButtonDiv.current && overflowMenuDiv.current) {
        const menu = overflowMenuDiv.current.getBoundingClientRect()
        const button = toggleMenuButtonDiv.current.getBoundingClientRect()

        const menuLeft = Math.round(button.left + (0.5 * button.width) - (0.5 * menu.width))
        const menuTop = Math.round(button.top - menu.height - button.height * 0.3)
        overflowMenuDiv.current!.style.top = menuTop + 'px'
        overflowMenuDiv.current!.style.left = menuLeft + 'px'
        overflowMenuDiv.current!.style.opacity = '0.98'
      }
    }
    window.setTimeout(updateMenuPosition, 200);

    // resize event
    const onResize = () => {
      if (searchButton.current) {
        document.body.classList.add("resize-animation-stopper");
        clearTimeout(nav.resizeTimer);
        let resizeTimer = setTimeout(
          () => {
            document.body.classList.remove("resize-animation-stopper")
        }, 400)
        setNav({
          ...nav,
          resizeTimer: (resizeTimer as any),
          showCollapsed: false,
          buttonWidth: searchButton.current.getBoundingClientRect().width
        })
      }
    }
    // handle resize event listeners
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [nav])

  // click closes menu, outside or inside menu
  React.useEffect(() => {
    const onClickAnywhere = (e: any) => {
      if (nav.showCollapsed) {
        setNav({ ...nav, showCollapsed: false })
      }
    }
    document.addEventListener('click', onClickAnywhere)
    return () => { document.removeEventListener('click', onClickAnywhere) }
  }, [nav])


  // all main buttons
  const buttonsArray = [
    [
      <span ref={ searchButton }>
        <Link
          className={ isHomePage ? styles.selected : '' }
          to='/'
        >
          search
        </Link>
      </span>
    ],[
      <Link
        className={ isCreatePage ? styles.selected : '' }
        to='/create'
      >
        owners
      </Link>
    ],[
      <a
        href="https://github.com/ildarmgt/BitcoinNameSystem"
        target="_blank"
        rel="noopener noreferrer"
      >
        &lt;{ 'source' }&gt;
      </a>
    ],[
      <Link
        className={ isAboutPage ? styles.selected : '' }
        to='/about'
      >
        about
      </Link>    ],[
      <Link
        className={ isSettingsPage ? styles.selected : '' }
        to='/settings'
      >
        settings
      </Link>
    ],[
      <Link
        className={ isWalletPage ? styles.selected : '' }
        to='/wallet'
      >
        wallet
      </Link>
    ],
  ]

  // using search button as metric, estimate how many buttons to show
  const windowWidth = window.innerWidth
  const stdSizer = 0.005 * (window.innerWidth + window.innerHeight)
  const safeWidthFraction = 0.8;
  const howManyButtonsFitSafely = nav.buttonWidth ? Math.min(
    Math.max(
      Math.floor(
        (windowWidth - 18 * stdSizer) * safeWidthFraction / ( nav.buttonWidth + stdSizer)
      ),
      1
    )
    , MAX_BUTTONS_TO_SHOW_UNCOLLAPSED
  ) : 1

  const buttonsOnNavbar = buttonsArray.filter((btn: any, i: number) =>
    (i <= howManyButtonsFitSafely - 1)
  )
  const buttonsOverflow = buttonsArray.filter((btn: any, i: number) =>
    (i > howManyButtonsFitSafely - 1)
  ) || []

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
        {/* page numbers (on tx creating pages) */}
        { isCreatePage && (
          <div className={ styles.pageNum }>
            { state.pageInfo.current }/6
          </div>
        ) }

        {/* collapsed menu toggle button */}
        { (!!buttonsOverflow.length) && (
          <div
            className={ [
              styles.collapsitron,
              // styles.button,
              nav.showCollapsed ? styles.menuShown : ''
            ].join(' ') }
            ref= { toggleMenuButtonDiv }
            onClick={ () => {
              setNav({ ...nav, showCollapsed: !nav.showCollapsed })
            } }
          >
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <div className={ styles.dots }><div /></div>

          </div>
        ) }

        {/* regular nav bar */}
        { buttonsOnNavbar.map((thisButton: any, index: number) => {
          return (
            <React.Fragment
              key={ 'nevbarbuttons' + index }
            >
              { thisButton[0] }
            </React.Fragment>
          )
        }).reverse()}

      </div>

      {/* collapsed menu window */}
      { (nav.showCollapsed) && (
        <div
          className={ styles.overflowMenu }
          ref={ overflowMenuDiv }
        >
          <div>
            { buttonsOverflow.map((thisButton: any, index: number) => {
                return (
                  <React.Fragment
                    key={ 'overflowbuttons' + index }
                  >
                    { thisButton[0] }
                  </React.Fragment>
                )
              }).reverse()
            }
          </div>
        </div>
      ) }

    </>
  )
}

// Hash history cannot PUSH the same path; a new entry will not be added to the history stack
// Only issue is the warning in console, but that only exists in development mode so can be ignored.