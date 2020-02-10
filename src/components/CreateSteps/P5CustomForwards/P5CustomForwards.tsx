import React, { useEffect } from 'react'
import { RoundButton } from '../../general/RoundButton'
import { Details } from './../../general/Details'
import styles from './P5CustomForwards.module.css'
import { Store, getOwner } from '../../../store'
import { changePageInfoAction, changeChoicesBNSAction } from '../../../store/actions'
import { stringByteCount, BYTES_MAX, findLatestForwards } from '../../../helpers/bns'
import sanitize from '../../../helpers/sanitize'

type Planned_Changes = { [key: string]: string }

/**
 * Edit custom forwards information.
 * state - global state.
 * textboxContent - text content inside the network and address textareas.
 */
export const P5CustomForwards = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)

  // object of planned changes derived from chosen string to embed
  const plannedChanges = (
    state.choices.embedString.split(' ').reduce((
      plannedChangesSoFar: Planned_Changes,
      word: string,
      index: number,
      words: Array<string>
    ): Planned_Changes => {
        if (index % 2 === 1) {
          return { ...plannedChangesSoFar, [words[index - 1]]: word }
        } else {
          return plannedChangesSoFar
        }
      }
    , {})
  )

  // change string to embed from an object of planned changes
  const setPlannedChanges = (objForwards: Planned_Changes) => {
    let forwardsString = ''
    Object.keys(objForwards).forEach(fwNetwork => {
      forwardsString += fwNetwork + ' ' + objForwards[fwNetwork] + ' '
    })
    if (forwardsString.length > 0) { forwardsString = forwardsString.slice(0, -1) }
    console.log('string to embed:', '"' + forwardsString + '"')
    changeChoicesBNSAction(state, dispatch, {
      embedString: forwardsString
    })
  }

  // array of past network:forwardingAddress objects
  // display only active ones with latest higher
  const pastForwards = findLatestForwards(getOwner(state)?.forwards || []).reverse()

  // local state for content in textboxes for new network address changes
  const [textboxContent, setTextboxContent] = React.useState({network: '', address: '' })

  // combine forwards into a string to embed
  const combineForwards = (objForwards: any) => {
    let forwardsString = ''
    Object.keys(objForwards).forEach(fwNetwork => {
      forwardsString += fwNetwork + ' ' + objForwards[fwNetwork] + ' '
    })
    if (forwardsString.length > 0) { forwardsString = forwardsString.slice(0, -1) }
    console.log('string to embed:', '"' + forwardsString + '"')
    return forwardsString
  }


  useEffect(() => {

  }, [])

  const bytesOfChanges = stringByteCount(combineForwards(plannedChanges))
  console.log(bytesOfChanges)

  return (
    <div className={ styles.wrapper }>
      <div className={ styles.title }>
        Update forwarding information
        <div
          className={ styles.subtitle }
        >
          Main action: { state.choices.action.info }
        </div>
      </div>
      <div className={ styles.changes }>
        {/* bytes info */ }
        { (Object.keys(plannedChanges).length === 0) && 'No forwarding updates' }
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
                setTextboxContent({ network: fwNetwork, address: plannedChanges[fwNetwork] })
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
        { (textboxContent.network.length > 0) &&
          <div
            className={ [styles.btnDelete, 'canPress'].join(' ') }
            onClick={ () => {
              setPlannedChanges({
                ...plannedChanges,
                [textboxContent.network]: ''
              })
              setTextboxContent({ network: '', address: '' })
            } }
          >
            No address
          </div>
        }
        <div
          className={ styles.editorNetwork }
        >
          <aside>Network</aside>
          <textarea
            spellCheck={ false }
            value={ textboxContent.network }
            placeholder={ 'e.g. btc' }
            onChange={ (e) => {
              const cleanText = sanitize(e.target.value, 'oneline')
              setTextboxContent({ ...textboxContent, network: cleanText })
              e.target.value = cleanText
            } }
          ></textarea>
        </div>
        <div
          className={ styles.editorAddress }
        >
          <aside>Forwarding address</aside>
          <textarea
            spellCheck={ false }
            value={ textboxContent.address }
            placeholder={ 'e.g. your btc address' }
            onChange={ (e) => {
              const cleanText = sanitize(e.target.value, 'oneline')
              setTextboxContent({ ...textboxContent, address: e.target.value })
              e.target.value = cleanText
            } }
          ></textarea>
        </div>
        <div
          className={ ['btnCircle', styles.btnAdd, 'canPress', 'addTooltip'].join(' ') }
          onClick={ () => {
            if (textboxContent.network !== '') {
              setPlannedChanges({
                ...plannedChanges,
                [textboxContent.network]: textboxContent.address
              })
              setTextboxContent({ network: '', address: '' })
            }
          } }
        >
          <span>+</span>
          <aside>Add to planned changes</aside>
        </div>
      </div>
      <div className={ styles.pastList } >
        <Details
          description={ 'What\'s this?' }
        >
          <p>
            Enter the forwarding addresses you want to use (e.g. long bitcoin address) and specify on which network that address should be used (e.g. btc) when someone wants to reach you after looking up your domain alias.<br />
            <br />
            Submit new updates by hitting [+] button. Remove updates by hitting [x] buttons.<br />
            <br />
            Below, the currently active forwarding addresses are shown, if any.<br />
            <br />
            Edit them by reusing the exact same network or remove by setting forwarding address to nothing or hitting [no address] button under network name text.
          </p>
        </Details>
        { pastForwards.map((fw: any, i: number) => {
          return (
            <div
              className={ styles.pastPair }
              key={ i }
              onClick={ () => {
                setTextboxContent({ network: fw.network, address: fw.address })
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
            changePageInfoAction(state, dispatch, 4)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          next='true'
          show={ bytesOfChanges > BYTES_MAX ? 'false' : 'true' }
          onClick={ () => {
            changePageInfoAction(state, dispatch, 6)
          }}
        >
          Ready
        </RoundButton>
      </div>
    </div>
  )
}

