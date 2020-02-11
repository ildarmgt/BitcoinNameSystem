import React from 'react'
import { Store, getOwner } from './../../store'
import { Link } from 'react-router-dom'

import styles from './SearchResults.module.css'
import timeDiff from './../../helpers/timediff'
import { OWNERSHIP_DURATION_BY_BLOCKS, interpretFw, findLatestForwards } from '../../helpers/bns/'
import { Details } from './../general/Details'

export const SearchResults = () => {
  // global state
  const { state } = React.useContext(Store)

  // calc time left in ownership via block heights
  // temp object to keep track of timers
  let diff = { isExpired: true, dh: '', msDiff: 0 }
  const owner = getOwner(state)
  if (owner) {
    const heightOfExpiration = owner.winHeight + OWNERSHIP_DURATION_BY_BLOCKS
    const blocksUntilExpires = (heightOfExpiration - state.chain.height)
    const msUntilExpires = blocksUntilExpires * 10.0 * 60.0 * 1000.0
    diff = timeDiff(msUntilExpires, 0)
  }

  // ownership information
  const ownershipInformation = () => {
    // abort if no known ownership history
    if (!owner) return ('')
    return (
      <>
        <table><tbody>
          <tr>
            <td>Owner</td>
            <td>
              <p>
                <span className={ styles.breakable }>{ owner.address }</span>
              </p>
            </td>
          </tr>
          <tr>
            <td>Notifications</td>
            <td>
              <p>
                <span className={ styles.breakable }>{ state.domain.notificationAddress }</span>
              </p>
            </td>
          </tr>
          <tr>
            <td>Ownership extended</td>
            <td>
              <p>{ owner.winHeight } block height</p>
              <p>{ new Date(owner.winTimestamp * 1000).toUTCString() }</p>
              <p>{ timeDiff(owner.winTimestamp * 1000).dh } ago</p>
            </td>
          </tr>
          <tr>
            <td>Expires</td>
            <td>
              <p>{ owner.winHeight + OWNERSHIP_DURATION_BY_BLOCKS } block height</p>
              <p>
                ≈ { new Date(
                  (OWNERSHIP_DURATION_BY_BLOCKS * 10.0 * 60.0 + owner.winTimestamp) * 1000
                ).toUTCString() }
              </p>
              <p>in ≈ { diff.dh }</p>
            </td>
          </tr>
        </tbody></table>
      </>
    )
  }

  // calculate latest forwards
  const latestForwards = owner ? findLatestForwards(owner.forwards) : []

  return (
    <>
      <div className={ styles.wrapper }>

        {/* scrollable search results */}
        <div className={ styles.listContainer } >

          <div
            className={ styles.describe }
          >
            <div className={ styles.describe__matches } >
              { latestForwards.length } matches on { state.network } {'  '}
            </div>

            {/* ownership details */}
            {(!diff.isExpired) && (
              <div className={ styles.ownershipDetails }>
                <Details
                  description={ 'Ownership details' }
                >

                  { ownershipInformation() }

                </Details>
              </div>
            )}
          </div>

          {/* general search results */}
          {
            latestForwards.map((fw: any) => {
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

          {/* show if domain is available */}
          <div className={ styles.avaiability }>
            {(diff.isExpired) && (
              <Link
                to='/create'
                className={ styles.createLink }
              >
                Domain available!
              </Link>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
