import React from 'react'
import { Store } from './../../store'
import { Link } from 'react-router-dom'

import styles from './SearchResults.module.css'
import timeDiff from './../../helpers/timediff'
import { OWNERSHIP_DURATION_BY_BLOCKS, interpretFw, findLatestForwards } from '../../helpers/bns/'


export const SearchResults = () => {
  const { state } = React.useContext(Store)

  // calc time left in ownership
  const diff = timeDiff(
    state.ownership.current.winTimestamp, // this is 0 when nothing found
    OWNERSHIP_DURATION_BY_BLOCKS
  )

  // account expires or expired information
  const expirationMsg = () => {
    // abort if no known ownership history
    if (state.ownership.current.winTimestamp === 0) { return ('') }
    return (
      <div
        className={ diff.expired ? styles.expired : styles.notExpired }
      >
        {(diff.expired
          ? 'expired ' + diff.dh + ' ago'
          : 'expires in ' + diff.dh
        )}
      </div>
    )
  }

  // calculate latest forwards
  const latestForwards = findLatestForwards(state.ownership.current.forwards)

  return (
    <>
      <div className={ styles.wrapper }>
        <div
          className={ styles.describe }
        >
          { latestForwards.length } matches on { state.network } {'  '}
          { expirationMsg() }
        </div>
        <div className={ styles.listContainer } >
          {(diff.expired) && (
            <Link
              to='/create'
              className={ styles.createLink }
            >
              Domain available!
            </Link>
          )}
        </div>
        <div className={ styles.listContainer } >
          {
            latestForwards.map(fw => {
              const ifw = interpretFw(fw)
              if (ifw.render) {
                return (
                  <a
                    key={ fw.network }
                    className={ styles.listItem }
                    href={ encodeURI(ifw?.link || '') || undefined }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={ styles.key }>{ ifw.where }</span>
                    { ifw.what }
                  </a>
                )
              } else {
                return ('')
              }
            })
          }
        </div>
      </div>
    </>
  )
}
