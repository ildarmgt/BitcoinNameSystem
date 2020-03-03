import React from 'react'
import { Store } from '../../store/'
import { useHistory } from 'react-router-dom'
import styles from './Navbar.module.css'
import { Wallet } from './../wallet/Wallet'
import { VisualAPI } from './../wallet/VisualAPI'
import { setApiAction } from './../../store'

const MAX_BUTTONS_TO_SHOW_UNCOLLAPSED = 4

export const Navbar = (): JSX.Element => {
  // global state
  const { state, dispatch } = React.useContext(Store)
  // url changer
  const history = useHistory()

  // references for objects of interest
  const searchButton = React.useRef<HTMLDivElement>(null)
  const toggleMenuButtonDiv = React.useRef<HTMLDivElement>(null)
  const overflowMenuDiv = React.useRef<HTMLDivElement>(null)

  // local state for navbar
  const [nav, setNav] = React.useState({
    buttonWidth: !!searchButton.current
      ? searchButton.current.offsetWidth
      : undefined,
    showCollapsed: false,
    resizeTimer: 0
  })

  // initialize nav bar measurements
  if (!nav.buttonWidth) {
    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 200)
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

        const menuLeft = Math.round(
          button.left + 0.5 * button.width - 0.5 * menu.width
        )
        const menuTop = Math.round(
          button.top - menu.height - button.height * 0.4
        )
        overflowMenuDiv.current!.style.top = menuTop + 'px'
        overflowMenuDiv.current!.style.left = menuLeft + 'px'
        overflowMenuDiv.current!.style.opacity = 'var(--finalOpacity)'
      }
    }
    window.setTimeout(updateMenuPosition, 100)

    // resize event
    const onResize = () => {
      if (searchButton.current) {
        document.body.classList.add('resize-animation-stopper')
        clearTimeout(nav.resizeTimer)
        const resizeTimer = setTimeout(() => {
          document.body.classList.remove('resize-animation-stopper')
        }, 400)
        setNav({
          ...nav,
          resizeTimer: resizeTimer as any,
          showCollapsed: false,
          buttonWidth: searchButton.current.getBoundingClientRect().width
        })
      }
    }
    // handle resize event listeners
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [nav])

  // click closes menu, outside or inside menu
  React.useEffect(() => {
    const onClickAnywhere = () => {
      if (nav.showCollapsed) {
        setNav({ ...nav, showCollapsed: false })
      }
    }
    document.addEventListener('click', onClickAnywhere)
    return () => {
      document.removeEventListener('click', onClickAnywhere)
    }
  }, [nav])

  // all main buttons
  const buttonsArray = [
    [
      <div
        key={'search'}
        ref={searchButton}
        className={[styles.button, isHomePage ? styles.selected : ''].join(' ')}
        onClick={() => {
          history.push('/')
        }}
      >
        search
      </div>
    ],
    [
      <div
        key={'create'}
        className={[styles.button, isCreatePage ? styles.selected : ''].join(
          ' '
        )}
        onClick={() => {
          history.push('/create')
        }}
      >
        users
      </div>
    ],
    [
      <div
        key={'git'}
        className={[styles.button].join(' ')}
        onClick={() => {
          window.open('https://github.com/ildarmgt/BitcoinNameSystem', '_blank')
        }}
      >
        &lt;{'source'}&gt;
      </div>
    ],
    [
      <div
        key={'about'}
        className={[styles.button, isAboutPage ? styles.selected : ''].join(
          ' '
        )}
        onClick={() => {
          history.push('/about')
        }}
      >
        about
      </div>
    ],
    [
      <div
        key={'settings'}
        className={[styles.button, isSettingsPage ? styles.selected : ''].join(
          ' '
        )}
        onClick={() => {
          history.push('/settings')
        }}
      >
        settings
      </div>
    ],
    [
      <div
        key={'wallet'}
        className={[styles.button, isWalletPage ? styles.selected : ''].join(
          ' '
        )}
        onClick={() => {
          history.push('/wallet')
        }}
      >
        wallet
      </div>
    ]
  ]

  /* -------------------------------------------------------------------------- */
  /*                           adding/removing buttons                          */
  /* -------------------------------------------------------------------------- */

  // using search button as metric, estimate how many buttons to show
  const windowWidth = window.innerWidth
  // calc(1*var(--s)), --s 0.5v 0.5w calculation
  const stdSizer = 0.005 * (window.innerWidth + window.innerHeight)
  const margin = 0.25 * stdSizer
  const safeWidthFraction = 0.5 // fraction of screen to use
  // adding extra 0.5 width for the ... button
  const howManyButtonsFitSafely = nav.buttonWidth
    ? Math.min(
        Math.max(
          Math.floor(
            (windowWidth * safeWidthFraction) /
              (nav.buttonWidth * 1.5 + 2 * margin)
          ),
          1
        ),
        MAX_BUTTONS_TO_SHOW_UNCOLLAPSED
      )
    : 1

  const buttonsOnNavbar = buttonsArray.filter(
    (btn: any, i: number) => i <= howManyButtonsFitSafely - 1
  )
  const buttonsOverflow =
    buttonsArray.filter(
      (btn: any, i: number) => i > howManyButtonsFitSafely - 1
    ) || []

  const TESTING = process.env.NODE_ENV === 'development'

  return (
    <>
      <div className={styles.warning}>
        <input type='checkbox' id={'closewarning'} />
        <label htmlFor='closewarning'>✕</label>
        <div>
          {state.network}
          <br />
          {TESTING && (
            <>
              development mode <br />
            </>
          )}
          not reviewed for use
        </div>
      </div>

      <div className={styles.leftCorner}>
        <div className={styles.wallet}>
          <Wallet
            txBuilder={{
              network: state.network
            }}
          />
        </div>

        {/* page numbers (on tx creating pages) */}
        {isCreatePage && (
          <div className={styles.pageNum}>Page {state.pageInfo.current}/6</div>
        )}

        <div className={styles.api}>
          <VisualAPI
            processId={state.api.processId}
            setProcessId={(processId: any) => {
              if (processId)
                setApiAction(state, dispatch, { running: true, processId })
            }}
            tasks={state.api.tasks}
            setTasks={(tasks: any) => setApiAction(state, dispatch, { tasks })}
            delayBusy={1000 / state.api.rateLimit}
            delayStandby={100}
          />
        </div>
      </div>

      <div className={styles.nav}>
        {/* collapsed menu toggle button */}
        {!!buttonsOverflow.length && (
          <div
            className={[
              styles.collapsitron,
              // styles.button,
              nav.showCollapsed ? styles.menuShown : ''
            ].join(' ')}
            ref={toggleMenuButtonDiv}
            onClick={() => {
              setNav({ ...nav, showCollapsed: !nav.showCollapsed })
            }}
          >
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <div className={styles.dots}>
              <div />
            </div>
          </div>
        )}

        {/* regular nav bar */}
        {buttonsOnNavbar
          .map((thisButton: any, index: number) => {
            return (
              <React.Fragment key={'nevbarbuttons' + index}>
                {thisButton[0]}
              </React.Fragment>
            )
          })
          .reverse()}
      </div>

      {/* collapsed menu window */}
      {nav.showCollapsed && (
        <div className={styles.overflowMenu} ref={overflowMenuDiv}>
          <div>
            {buttonsOverflow
              .map((thisButton: any, index: number) => {
                return (
                  <React.Fragment key={'overflowbuttons' + index}>
                    {thisButton[0]}
                  </React.Fragment>
                )
              })
              .reverse()}
          </div>
        </div>
      )}
    </>
  )
}

// Hash history cannot PUSH the same path; a new entry will not be added to the history stack
// Only issue is the warning in console, but that only exists in development mode so can be ignored.
