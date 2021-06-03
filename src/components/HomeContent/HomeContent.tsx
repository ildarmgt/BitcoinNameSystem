import React, { useEffect, useRef } from 'react'
import { RoundButton } from './../general/RoundButton'
import { Store } from '../../store/'
import { searchAction, changeAliasAction } from './../../store/actions/'
import { useHistory, Redirect } from 'react-router-dom'
import { SearchResults } from './../SearchResults'
import styles from './HomeContent.module.css'

/**
 * Root landing page.
 */
export const HomeContent = (props: any): JSX.Element => {
  const { state, dispatch } = React.useContext(Store)
  // url changer
  const history = useHistory()

  // if page is loaded with #/id/:alias format
  // this will change alias to that one
  // then it will navigate to '/'
  // and then it will do search with new alias
  // http://localhost:3000/#/id/satoshi
  const alias = props?.match?.params?.alias
    // remove any characters after any dots e.g. satoshi.btc becomes satoshi
    ?.split('.')[0]
  const hash = window.location.hash
  const reroute = () => {
    // run to remove path after #/
    if (hash !== '#/') history.push('/')
  }
  if (alias && hash !== '#/') {
    console.log('alias id detected in url:', alias, hash)
    searchAction({ ...state, alias }, dispatch)
      .then(() => reroute())
      .catch(() => reroute())
  }
  // to handle root calls without alias so no need for just /id/ on end
  if (hash === '#/id/') history.push('/')

  // is serach done
  const isSearchDone = () => state.pageInfo.checkedLightSearch

  // put the textarea into focus on mount and move caret to end
  const inputEl = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (inputEl && inputEl.current) {
      inputEl.current.selectionEnd = inputEl.current.value.length
      inputEl.current.selectionStart = inputEl.current.value.length
      inputEl.current.focus()
    }
  }, [])

  // key presses set focus on textarea
  useEffect(() => {
    const onAnyKey = (e: any) => {
      // check session storage if wallet is visible so don't focus
      const walletVisible =
        window.sessionStorage.getItem('fromWallet') === String(true)
      // don't count reserved keys
      const EXCEPTIONS = ['`']
      if (!walletVisible && !EXCEPTIONS.some(v => v === e.key)) {
        if (document.activeElement?.id !== 'txtSearch') {
          inputEl?.current?.focus()
        }
      }
    }
    document.addEventListener('keydown', onAnyKey)
    return () => {
      document.removeEventListener('keydown', onAnyKey)
    }
  }, [])

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.wrapper}>
      {/* only way routing asap doesn't give "cant change state during render..." */}
      {alias && hash !== '#/' && <Redirect to='/' />}

      <div
        className={
          !isSearchDone()
            ? [styles.lblMainTitle].join(' ')
            : [styles.lblMainTitle, styles.lblMainTitleAfter].join(' ')
        }
        onClick={() => {
          changeAliasAction(state, dispatch, '') // reset search box
        }}
      >
        <span>Bitcoin</span> Name System
      </div>
      <div
        className={
          !isSearchDone()
            ? styles.divSearch
            : [styles.divSearch, styles.divSearchAfter].join(' ')
        }
      >
        <textarea
          id='txtSearch'
          className={styles.txtSearch}
          cols={30}
          rows={1}
          spellCheck={false}
          value={state.alias}
          placeholder={'e.g. satoshi'}
          ref={inputEl}
          onChange={ e => {
            const rawtext = e?.target?.value || ''
            changeAliasAction(state, dispatch, rawtext)
          }}
          onKeyPress={e => {
            e.key === 'Enter' && searchAction(state, dispatch)
          }}
        ></textarea>
        <RoundButton
          sizebutton='2.6'
          onClick={() => {
            searchAction(state, dispatch)
          }}
        >
          .btc
        </RoundButton>
      </div>
      {/* <div
        className={styles.results}
        style={{ display: isSearchDone() ? 'block' : 'none' }}
      > */}
      {!!isSearchDone() && <SearchResults />}
      {/* </div> */}
    </div>
  )
}
