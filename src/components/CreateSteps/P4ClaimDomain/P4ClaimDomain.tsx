import React, { useEffect } from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P4ClaimDomain.module.css'
import { Store } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'
import { calcBidDomainTx, stringByteCount } from '../../../helpers/bns/'
import sanitize from './../../../helpers/sanitize'

const BYTES_MAX = 80

/**
 * Bid on network
 */
export const P4ClaimDomain = () => {
  const { state, dispatch } = React.useContext(Store) // global state

  // array of network:forwardingAddress objects
  const forwards = state.ownership.current.forwards.slice().reverse()

  // local state for data to embed (content inside textboxes for network/address)
  const [customAdd, setCustomAdd] = React.useState({network: '', address: '' })

  // local state for all data to embed in this tx
  const initialChanges = {}
  // const initialChanges = {
  //   longaddresscentral: 'banananannananananaananannaaannananannaanannananannananannanananan3456abcdefghi',
  //   thisisaverylongnetworknamethisisaverylongnetworknamethisisaverylongnetworkname: 'lol',
  //   http: '',
  //   imgur: 'abcde.jpg'
  // }
  const [data, setData] = React.useState(initialChanges as { [key: string]: string })

  // local state for tx hex
  const [tx, setTx] = React.useState({ hex: '', txid: '' })

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

  // calculate tx (on mount or changes in global state or local data to embed)
  useEffect(() => {
    try { // to make tx
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
    } catch (e) {
      // tx creation expected to fail often
    }
  }, [state, data])

  console.log('tx attempt info', tx)

  const bytesOfChanges = stringByteCount(combineForwards(data))
  console.log(bytesOfChanges)

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Update forwarding information
      </div>
      <div className={ styles.changes }>
        {/* bytes info */ }
        { (Object.keys(data).length === 0) && 'Nothing added yet' }
        { (bytesOfChanges <= BYTES_MAX) &&
          <div className={ styles.bytesLeft }>
            { BYTES_MAX - bytesOfChanges } Bytes left
          </div>
        }
        { (bytesOfChanges > BYTES_MAX) &&
          <div className={ styles.bytesOver }>
            Too much by { bytesOfChanges - BYTES_MAX } Bytes
          </div>
        }
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
                      Updating forwarding on <span>{ ' ' + fwNetwork + ' ' }</span>
                      network to address of <span>{ ' ' + data[fwNetwork] + ' ' }</span>
                      <i>{' '}(+{ stringByteCount(fwNetwork + ' ' + data[fwNetwork]) }B)</i>
                    </>)
                    : (<>
                      Deleting previously set forwarding information for
                      <span>{ ' ' + fwNetwork + ' '}</span> network
                      <i>{' '}(+{ stringByteCount(fwNetwork + ' ' + data[fwNetwork]) }B)</i>
                    </>)
                }
              </div>
              <div
                className={ ['btnCircle', styles.updateCancel, 'addTooltipRight'].join(' ') }
                onClick={ (e) => {
                  const newData = { ...data }
                  delete newData[fwNetwork]
                  setData(newData)
                  e.stopPropagation()
                } }
              >
                <span>×</span>
                <aside>Remove from planned changes</aside>
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
            No address
        </div> }
        <textarea
          spellCheck={ false }
          value={ customAdd.network }
          className={ styles.editorNetwork }
          placeholder={ 'network' }
          onChange={ (e) => {
            const cleanText = sanitize(e.target.value, 'oneline')
            setCustomAdd({ ...customAdd, network: cleanText })
            e.target.value = cleanText
          } }
        ></textarea>
        <textarea
          spellCheck={ false }
          value={ customAdd.address }
          className={ styles.editorAddress }
          placeholder={ 'address on network' }
          onChange={ (e) => {
            const cleanText = sanitize(e.target.value, 'oneline')
            setCustomAdd({ ...customAdd, address: e.target.value })
            e.target.value = cleanText
          } }
        ></textarea>
        <div
          className={ ['btnCircle', styles.btnAdd, 'canPress', 'addTooltip'].join(' ') }
          onClick={ () => {
            setData({
              ...data,
              [customAdd.network]: customAdd.address
            })
            setCustomAdd({ network: '', address: '' })
          } }
        >
          <span>+</span>
          <aside>Add to planned changes</aside>
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
        <RoundButton
          next='true'
          onClick={ () => {
            // changePageInfoAction(state, dispatch, 5)
          }}
        >
          Ready
        </RoundButton>
      </div>
    </div>
  )
}

