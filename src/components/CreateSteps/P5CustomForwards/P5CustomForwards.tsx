import React, { useEffect } from 'react'
import { RoundButton } from '../../general/RoundButton'
import styles from './P5CustomForwards.module.css'
import { Store, getOwner } from '../../../store'
import { changePageInfoAction } from '../../../store/actions'
import { calcBidDomainTx, stringByteCount, BYTES_MAX } from '../../../helpers/bns'
import sanitize from '../../../helpers/sanitize'

/**
 * Bid on network
 */
export const P5CustomForwards = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // array of network:forwardingAddress objects
  const forwards = getOwner(state)?.forwards.slice().reverse() || []

  // local state for plannedChanges to embed (content inside textboxes for network/address)
  const [customAdd, setCustomAdd] = React.useState({network: '', address: '' })

  // local state for all plannedChanges to embed in this tx
  const initialPlannedChanges = {}
  const [plannedChanges, setPlannedChanges] = React.useState(
    initialPlannedChanges as { [key: string]: string }
  )

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

  // calculate tx (on mount or changes in global state or local plannedChanges to embed)
  useEffect(() => {
    try { // to make tx
      setTx(
        calcBidDomainTx(
          combineForwards(plannedChanges),
          state.wallet,
          state.domain,
          state.settings.feeRate,
          state.network
        )
      )
    } catch (e) {
      // tx creation expected to fail often
    }
  }, [state, plannedChanges])

  console.log('tx attempt info', tx)

  const bytesOfChanges = stringByteCount(combineForwards(plannedChanges))
  console.log(bytesOfChanges)

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Update forwarding information
      </div>
      <div className={ styles.changes }>
        {/* bytes info */ }
        { (Object.keys(plannedChanges).length === 0) && 'Nothing added yet' }
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
        { Object.keys(plannedChanges).map((fwNetwork) => {
          return (
            <div
              className={ styles.updateItem }
              key={ fwNetwork }
              onClick={ () => {
                setCustomAdd({ network: fwNetwork, address: plannedChanges[fwNetwork] })
              } }
            >
              <div
                className={ styles.updateInfo }
              >
                {
                  (plannedChanges[fwNetwork] !== '')
                    ? (<>
                      Updating forwarding on <span>{ ' ' + fwNetwork + ' ' }</span>
                      network to address of <span>{ ' ' + plannedChanges[fwNetwork] + ' ' }</span>
                      <i>{' '}(+{ stringByteCount(fwNetwork + ' ' + plannedChanges[fwNetwork]) }B)</i>
                    </>)
                    : (<>
                      Deleting previously set forwarding information for
                      <span>{ ' ' + fwNetwork + ' '}</span> network
                      <i>{' '}(+{ stringByteCount(fwNetwork + ' ' + plannedChanges[fwNetwork]) }B)</i>
                    </>)
                }
              </div>
              <div
                className={ ['btnCircle', styles.updateCancel, 'addTooltipRight'].join(' ') }
                onClick={ (e) => {
                  const newData = { ...plannedChanges }
                  delete newData[fwNetwork]
                  setPlannedChanges(newData)
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
            setPlannedChanges({
              ...plannedChanges,
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
            setPlannedChanges({
              ...plannedChanges,
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
            changePageInfoAction(state, dispatch, 5)
          }}
        >
          Ready
        </RoundButton>
      </div>
    </div>
  )
}

