import React, { useEffect } from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ClaimDomain.module.css'
import { Store } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'

import { calcBidDomainTx } from '../../../helpers/bns/'

/**
 * Bid on network
 */
export const P4ClaimDomain = () => {
  const { state, dispatch } = React.useContext(Store) // global state

  // array of network:forwardingAddress objects
  const forwards = state.ownership.current.forwards.slice().reverse()

  // local state for data to embed (content inside textboxes for network/address)
  const [customAdd, setCustomAdd] = React.useState({network: '', address: '' })

  // local state for all data to embed
  const [data, setData] = React.useState({} as { [key: string]: string })

  // local state for tx hex
  const [tx, setTx] = React.useState({ hex: '', txid: '' })

  // calculate tx (on mount or changes in global state or local data to embed)
  useEffect(() => {
    // combine forwards into a string for the tx
    const combineForwards = (objForwards: any) => {
      let forwardsString = ''
      Object.keys(objForwards).forEach(fwNetwork => {
        forwardsString += fwNetwork + ' ' + objForwards[fwNetwork] + ' '
      })
      if (forwardsString.length > 0) { forwardsString = forwardsString.slice(0, -1) }
      console.log('string to embed:', '"' + forwardsString + '"')
      return forwardsString
    }

    setTx(
      calcBidDomainTx(
        combineForwards(data),
        state.wallet,
        state.alias + state.extension,
        state.settings.feeRate,
        state.notifications.txHistory,
        state.network
      )
    )
  }, [state, data])

  console.log(tx)


  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Add new forwarding changes
      </div>
      <div className={ styles.changes }>
        { (Object.keys(data).length === 0) && 'Nothing added yet' }
        { Object.keys(data).map((fwNetwork) => {
          return (
            <div
              className={ styles.updateItem }
              key={ fwNetwork }
              onClick={ () => {
                setCustomAdd({ network: fwNetwork, address: data[fwNetwork] })
              } }
            >
              <div
                className={ styles.updateInfo }
              >
                {
                  (data[fwNetwork] !== '')
                    ? (<>
                      Updating forwarding on <span>{ fwNetwork }</span> network to address of <span>{ data[fwNetwork] }</span>
                    </>)
                    : (<>Deleting previously set forwarding information for <span>{ fwNetwork }</span> network</>)
                }
              </div>
              <div
                className={ ['btnCircle', styles.updateCancel].join(' ') }
                onClick={ (e) => {
                  const newData = { ...data }
                  delete newData[fwNetwork]
                  setData(newData)
                  e.stopPropagation()
                } }
              >
                <span>×</span>
              </div>
            </div>
          )
        }) }
      </div>
      <div className={ styles.editor } >
        { (customAdd.network.length > 0) && <div
          className={ [styles.btnDelete, 'canPress'].join(' ') }
          onClick={ () => {
            setData({
              ...data,
              [customAdd.network]: ''
            })
            setCustomAdd({ network: '', address: '' })
          } }
        >
          Delete
        </div> }
        <textarea
          spellCheck={ false }
          value={ customAdd.network }
          className={ styles.editorNetwork }
          placeholder={ 'network' }
          onChange={ (e) => {
            setCustomAdd({ ...customAdd, network: e.target.value })
          } }
        ></textarea>
        <textarea
          spellCheck={ false }
          value={ customAdd.address }
          className={ styles.editorAddress }
          placeholder={ 'address on network' }
          onChange={ (e) => {
            setCustomAdd({ ...customAdd, address: e.target.value })
          } }
        ></textarea>
        <div
          className={ ['btnCircle', styles.btnAdd, 'canPress'].join(' ') }
          onClick={ () => {
            setData({
              ...data,
              [customAdd.network]: customAdd.address
            })
            setCustomAdd({ network: '', address: '' })
          } }
        >
          <span>+</span>
        </div>
      </div>
      <div className={ styles.pastList } >
        { forwards.map((fw: any, i: number) => {
          return (
            <div
              className={ styles.pastPair }
              key={ i }
              onClick={ () => {
                setCustomAdd({ network: fw.network, address: fw.address })
              } }
            >
              <div className={ styles.pastNetwork } >
                { fw.network }
              </div>
              <div className={ styles.pastAddress } >
                { fw.address }
              </div>
            </div>
          )
        }) }
      </div>
      <div className={ styles.buttonWrapper }>
        <RoundButton
          back='true'
          onClick={ () => {
            changePageInfoAction(state, dispatch, 3)
          }}
        >
          Back
        </RoundButton>
      </div>
    </div>
  )
}

// const dummyChanges = {
//   longaddresscentral: 'banananannananananaananannaaannananannaanannananannananannanananan3456abcdefghi',
//   thisisaverylongnetworknamethisisaverylongnetworknamethisisaverylongnetworkname: 'lol',
//   http: '',
//   imgur: 'abcde.jpg'
// }