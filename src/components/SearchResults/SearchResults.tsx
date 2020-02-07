import React from 'react'
import { Store, getOwner } from './../../store'
import { Link } from 'react-router-dom'

import styles from './SearchResults.module.css'
import timeDiff from './../../helpers/timediff'
import { OWNERSHIP_DURATION_BY_BLOCKS, interpretFw, findLatestForwards } from '../../helpers/bns/'


export const SearchResults = () => {
  // global state
  const { state } = React.useContext(Store)

  // temp object to keep track of timers
  let diff = { isExpired: true, dh: '' }

  // calc time left in ownership via block heights
  const owner = getOwner(state)
  if (owner) {
    const heightOfExpiration = owner.winHeight + OWNERSHIP_DURATION_BY_BLOCKS
    const blocksUntilExpires = (heightOfExpiration - state.chain.height)
    const msUntilExpires = blocksUntilExpires * 10.0 * 60.0 * 1000.0
    diff = timeDiff(msUntilExpires, 0)
  }

  // account expires or isExpired information
  const expirationMsg = () => {
    // abort if no known ownership history
    if (!owner) return ('')
    return (
      <div
        className={ diff.isExpired ? styles.expired : styles.notExpired }
      >
        { !diff.isExpired && ('expires in ' + diff.dh) }
      </div>
    )
  }

  // calculate latest forwards
  const latestForwards = owner ? findLatestForwards(owner.forwards) : []

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
          {(diff.isExpired) && (
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
