import React, { useEffect, useRef } from 'react'
import { RoundButton } from './../general/RoundButton'
import { Store } from './../../store/'
import { searchAction, changeAliasAction } from './../../store/actions/'
import { SearchResults } from './../SearchResults'
import styles from './HomeContent.module.css'

export const HomeContent = (props: any): JSX.Element => {
  const { state, dispatch } = React.useContext(Store)

  // if page is loaded with #/id/:alias format
  // this will change alias to that one
  // then it will navigate to '/'
  // and then it will do search with new alias
  // http://localhost:3000/#/id/satoshi
  const alias = props?.match?.params?.alias
  if (alias) {
    searchAction({...state, alias}, dispatch, props.history)
  }

  // is serach done
  const isSearchDone = () => state.domain.checkedHistory

  // put the textarea (by ref) into focus on mount and move caret to end
  const inputEl = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (inputEl && inputEl.current) {
      inputEl.current.selectionEnd = inputEl.current.value.length
      inputEl.current.selectionStart = inputEl.current.value.length
      inputEl.current.focus()
    }
  }, [])

  const placeHolder = 'satoshi'
  return (
    <>
      <div className={
        !isSearchDone()
          ? [styles.lblMainTitle, styles.noselect].join(' ')
          : [styles.lblMainTitle, styles.lblMainTitleAfter, styles.noselect].join(' ')
      }>
        <span>Bitcoin</span> Name System
      </div>
      <div className={
        !isSearchDone()
          ? styles.divSearch
          : [styles.divSearch, styles.divSearchAfter].join(' ')
      }>
        <textarea
          id="txtSearch"
          className={ styles.txtSearch }
          cols={ 30 }
          rows={ 1 }
          spellCheck={ false }
          value={ state.alias }
          placeholder={ placeHolder }
          ref={ inputEl }
          onChange={ e => changeAliasAction(state, dispatch, e?.target?.value) }
          onKeyPress={ e => { e.key === 'Enter' && searchAction(state, dispatch) } }
        ></textarea>
        <RoundButton
          sizebutton='2.6'
          onClick={ () => searchAction(state, dispatch) }
        >
          .btc
        </RoundButton>
      </div>
      <div style={{ display: isSearchDone() ? 'block' : 'none' }}>
        <SearchResults />
      </div>
    </>
  )
}
