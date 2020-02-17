import React from 'react'
import { Store, getOwner, getBidding } from './../../store'
import { Link } from 'react-router-dom'

import styles from './SearchResults.module.css'
import timeDiff from './../../helpers/timediff'
import { OWNERSHIP_DURATION_BY_BLOCKS, CHALLENGE_PERIOD_DURATION_BY_BLOCKS, interpretFw, findLatestForwards } from '../../helpers/bns/'
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


  // show BTC balance with styling and proper units based on network
  const unitBTC = (state.network === 'testnet') ? ' tBTC ' : ' BTC '
  const showBTC = (sats: number = 0): JSX.Element => (
    <>
      <span className={ styles.balance }>
        { (sats / 1e8).toFixed(8) }
      </span>
      { unitBTC }
    </>
  )

  const notificationLink = (
    <span
      className={ [styles.breakable, styles.linkable].join(' ') }
      key={'notify1'}
      onClick={ ()=> {
        const pathEdit = (state.network === 'testnet') ? 'testnet/' : ''
        window.open(
          `https://blockstream.info/${pathEdit}address/${state.domain.notificationAddress}`
          , '_blank'
        )
      } }
    >
      { state.domain.notificationAddress }
    </span>
  )

  // get ownership info
  const tabledOwnershipData = owner ? [
    [['Owner'],               [[
                                <span
                                  className={ styles.breakable }
                                  key={ 'owner1' }
                                  >
                                  { owner.address }
                                </span>
                              ]]
    ],
    [['Notifications'],       [[
                                notificationLink
                              ]]
    ],
    [['Ownership extended'],  [
                                [owner.winHeight + ' block height'],
                                [new Date(owner.winTimestamp * 1000).toUTCString()],
                                [timeDiff(owner.winTimestamp * 1000).dh + ' ago'],
                                [
                                  <React.Fragment
                                    key={ 'ownership1' }
                                  >
                                    { showBTC(owner.burnAmount) } winning bid
                                  </React.Fragment>
                                ]
                              ]
    ],
    [['Ownership expires'],   [
                                [(owner.winHeight + OWNERSHIP_DURATION_BY_BLOCKS) + ' block height'],
                                [
                                  '≈ ' + new Date(
                                    (OWNERSHIP_DURATION_BY_BLOCKS * 10.0 * 60.0 + owner.winTimestamp) * 1000
                                  ).toUTCString()
                                ],
                                ['in ≈ ' + diff.dh]
                              ]
    ]
  ] : []

  // get burning info
  const { isBurn, bidding } = getBidding(state)
  const tabledBiddingData = isBurn ? [
    [['Owner'],             [['Owner will be determined when bidding period ends']]],
    [['Notifications'],    [[
                              notificationLink
                            ]]
    ],
    [['Bidding start'],     [
                              [bidding.startHeight + ' block height'],
                              // first bid is one that starts it so unix time stamp accurate
                              [new Date(bidding.bids[0].timestamp * 1000.0).toUTCString()],
                              [timeDiff(bidding.bids[0].timestamp * 1000.0).dh + ' ago']
                            ]
    ],
    [['Bidding ends'],      [
                              [bidding.endHeight + ' block height'],
                              [
                                '≈ ' + new Date(
                                  bidding.bids[0].timestamp * 1000.0 + (CHALLENGE_PERIOD_DURATION_BY_BLOCKS * 10.0 * 60.0 * 1000.0)
                                ).toUTCString()
                              ],
                              [
                                'in ≈ ' + timeDiff(
                                  bidding.bids[0].timestamp * 1000.0 + (CHALLENGE_PERIOD_DURATION_BY_BLOCKS * 10.0 * 60.0 * 1000.0)
                                ).dh
                              ]
                            ]
    ],
    [['Bidders'],           [
                              ...(bidding.bids.map((thisBid: any, bidIndex: number) => (
                                [
                                  <React.Fragment
                                    key={ 'bidding' + bidIndex }
                                  >
                                    { showBTC(thisBid.value) } burned by
                                    {' '}<span className={ styles.breakable }>{ thisBid.address }</span>
                                  </React.Fragment>
                                ]
                              )))
                            ]
    ]
  ] : []

  // get most basic available domain info
  const tabledAvailableDomainData = [
    [['Owner'],             [['No owner. No bids.']]],
    [['Notifications'],     [[
                              notificationLink
                            ]]
    ]
  ]

  // display data in styled table format
  const expandableTable = (inputData: Array<any>, inputDescription: string) => {
    if (inputData.length === 0) return ''
    return (
      <div className={ styles.ownershipDetails }>
        <Details
          description={ inputDescription }
        >

          <table><tbody>
            { inputData.map((rows: any, index: number) => (
              <tr
                key={ rows[0][0] }
              >
                <td>{ rows[0][0] }</td>
                <td>
                  {
                    rows[1].map((dataRows: any, dataRowIndex: number) => (
                      <p
                        key={ [index,dataRowIndex].join(' ') }
                      >
                        { dataRows }
                      </p>
                    ))
                  }
                </td>
              </tr>
            )) }
          </tbody></table>

        </Details>
      </div>
    )
  }

  // calculate latest forwards
  const latestForwards = owner ? findLatestForwards(owner.forwards) : []

  return (
    <>
      <div className={ [styles.wrapper, 'scrollbar'].join(' ') }>

        {/* scrollable search results */}
        <div className={ styles.listContainer } >

          <div
            className={ styles.describe }
          >
            {/* only show matches when there is owner */}
            {(!isBurn && !!owner) &&
            (
              <div className={ styles.describe__matches } >
                { latestForwards.length } matches on { state.network } {'  '}
              </div>
            )}

            {/* no wonder but bidding period started */}
            {
              (isBurn) && (
                expandableTable(tabledBiddingData, 'Bidding information')
              )
            }

            {/* if no owner and no bidding - totally available */}
            {
              (!isBurn && !owner) && (
                expandableTable(tabledAvailableDomainData, 'Available information')
              )
            }

            {/* owner exists - ownership details */}
            {(!!owner) && (
              <div className={ styles.ownershipDetails }>
                { expandableTable(tabledOwnershipData, 'Ownership details')}
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
            {(!owner) && (
              <Link
                to='/create'
                className={ styles.createLink }
              >
                { isBurn ? 'Bidding started. Join?' : 'Domain available!' }
              </Link>
            )}
          </div>

        </div>
      </div>
    </>
  )
}



