import React from 'react'
import { RoundButton } from '../../general/RoundButton'
import { Details } from './../../general/Details'
import styles from './P5CustomForwards.module.css'
import { Store, getOwner } from '../../../store/'
import {
  changePageInfoAction,
  changeChoicesBNSAction
} from '../../../store/actions'
import {
  stringByteCount,
  BYTES_MAX,
  findLatestForwards,
  interpretCommand
} from '../../../helpers/bns'
import sanitize from '../../../helpers/sanitize'

type Planned_Changes = { [key: string]: string }

/**
 * Component to edit custom forwards information.
 * state - global state.
 * textboxContent - text content inside the network and address textareas.
 */
export const P5CustomForwards = () => {
  // global state
  const { state, dispatch } = React.useContext(Store)
  // string to embed located at state.choices.embedString

  // local state for content in textboxes for new network address changes
  const [textboxContent, setTextboxContent] = React.useState({
    network: '',
    address: ''
  })

  // Check if the main action requires space in the embed string.
  // Return necessary string. No extra spaces.
  // e.g. returns: '', '!ca 234', '!abc '
  const getActionEmbedRequirements = (): string => {
    const chosenAction = state.choices.action
    let stringFromCommands = ''
    // Go through all action's suggestions and combine any commands found.
    // This is compatible with 0, 1, or multiple commands being used at same time.
    chosenAction.suggestions.forEach((thisSuggestion: any) => {
      if ('command' in thisSuggestion.info) {
        // command setting found,
        // so add its contents to string and add value in getter as command match
        stringFromCommands += thisSuggestion.info.command + ' '
        stringFromCommands += thisSuggestion.info.get.value + ' '
      }
    })

    // remove extra space from end ('' stays '')
    stringFromCommands = stringFromCommands.slice(0, -1)

    // console.log('after checking', chosenAction.suggestions)
    // console.log('getActionEmbedRequirements returned', stringFromCommands)
    return stringFromCommands
  }

  // set global state's string to embed from an object of planned changes
  const setPlannedChanges = (objForwards: Planned_Changes = {}) => {
    let forwardsString = ''
    Object.keys(objForwards).forEach(fwNetwork => {
      forwardsString += fwNetwork + ' ' + objForwards[fwNetwork] + ' '
    })
    // remove extra space from end ('' stays '')
    forwardsString = forwardsString.slice(0, -1)

    // to avoid useless rerenders, only change state
    // if it current state string doesn't match calculated string
    const needsChanging = forwardsString !== state.choices.embedString

    if (needsChanging) {
      changeChoicesBNSAction(state, dispatch, {
        embedString: forwardsString
      })
    }
  }

  // Object of planned changes derived from
  // global state embedString and action choice
  const getPlannedChanges = () => {
    // this is string that's going to be embedded
    const forwardsString = state.choices.embedString

    // get required by actions string as well
    const actionRequirementsString = getActionEmbedRequirements()

    // combine (later string values are given priority)
    const finalString =
      forwardsString +
      // if either are blank, no need to separate with space
      (actionRequirementsString === '' || forwardsString === '' ? '' : ' ') +
      actionRequirementsString

    // convert all changes to object so same networks overwrite themselves as keys.
    const changesObject = finalString.split(' ').reduce(
      (
        // add each planned change into plannedChangesSoFar
        plannedChangesSoFar: Planned_Changes,
        // from each word
        word: string,
        index: number,
        // out of this array of words
        words: Array<string>
      ): Planned_Changes => {
        if (index % 2 === 1) {
          return { ...plannedChangesSoFar, [words[index - 1]]: word }
        } else {
          return plannedChangesSoFar
        }
      },
      {} // initial value for plannedChangesSoFar
    )
    return changesObject
  }

  // If embed string is empty (to minimize calculations per render), call setPlannedChanges to initialize it
  // since it doesn't update state unless it's necessary, no refresh is triggered each render
  if (state.choices.embedString === '') setPlannedChanges(getPlannedChanges())

  // Array of past {[network]:forwardingAddress} objects.
  // Display only active ones with latest higher.
  const pastForwards = findLatestForwards(
    getOwner(state)?.forwards || []
  ).reverse()

  // count # of bytes in string
  const bytesOfChanges = stringByteCount(state.choices.embedString)
  // count # of bytes left for storage
  const bytesLeft = BYTES_MAX - bytesOfChanges
  // if no more space
  const isSpaceFull = bytesLeft < 0

  /**
   * Render explanation of the change with submitted forwards network name
   */
  const explainForwards = (fwNetwork: string) => {
    const value = getPlannedChanges()[fwNetwork]

    // display byte cost (including separator)
    const bytes = stringByteCount(fwNetwork + ' ' + value)
    const thisByteCostEstimate = (
      <i>
        {' '}
        ({bytes}-{bytes + 1}B)
      </i>
    )

    // return first match for explanation content
    const interpretation = () => {
      // if it was a command
      if (fwNetwork.startsWith('!')) {
        const cmd = interpretCommand(fwNetwork, value)
        return {
          content: (
            <>
              {cmd ? (
                <>
                  {cmd.info} user action. {cmd.getterName} is set to{' '}
                  <span>{cmd.value}</span>.
                </>
              ) : (
                'User action'
              )}
              {thisByteCostEstimate}
            </>
          ),
          allowRemoval: false
        }
      }

      // regular forwarding: network's forwarding address was provided
      if (value !== '') {
        return {
          content: (
            <>
              Updating forwarding on <span>{' ' + fwNetwork + ' '}</span>
              network to address of <span>{' ' + value + ' '}</span>
              {thisByteCostEstimate}
            </>
          ),
          allowRemoval: true
        }
      }

      // regular forwarding: if network's forwarding address was set blank
      if (value === '') {
        return {
          content: (
            <>
              Deleting previously set forwarding information for
              <span>{' ' + fwNetwork + ' '}</span> network
              {thisByteCostEstimate}
            </>
          ),
          allowRemoval: true
        }
      }

      return { content: '' }
    }

    return (
      <div
        className={styles.updateItem}
        key={fwNetwork}
        onClick={() => {
          // fill in the edit field with these values in case
          setTextboxContent({ network: fwNetwork, address: value })
        }}
      >
        <div className={styles.updateInfo}>{interpretation().content}</div>
        {/* removal button. only render removal button if allowed */}
        {interpretation().allowRemoval && (
          <div
            className={[
              'btnCircle',
              styles.updateCancel,
              'addTooltipRight'
            ].join(' ')}
            onClick={e => {
              const newData = { ...getPlannedChanges() }
              delete newData[fwNetwork]
              setPlannedChanges(newData)
              // block event from also clicking onto the updateItem
              e.stopPropagation()
            }}
          >
            <span>×</span>
            <aside>Remove from planned changes</aside>
          </div>
        )}
      </div>
    )
  }

  console.log('bytes to embed', bytesOfChanges)

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Update forwarding information</div>

      <div className={styles.subtitle}>
        BNS action: {state.choices.action.info}
      </div>

      <div className={styles.changes}>
        {/* bytes info */}
        {Object.keys(getPlannedChanges()).length === 0
          ? 'no forwarding updates'
          : 'planned forwarding updates'}
        {!isSpaceFull && (
          <div className={styles.bytesLeft}>{bytesLeft} Bytes left</div>
        )}
        {isSpaceFull && (
          <div className={styles.bytesOver}>
            Too much by {Math.abs(bytesLeft)} Bytes
          </div>
        )}

        {/* Show, explain, and allow editing and removing of each added key/value pair to embed */}
        {Object.keys(getPlannedChanges()).map((fwNetwork: any) =>
          explainForwards(fwNetwork)
        )}
      </div>

      <div className={styles.editor}>
        {textboxContent.network.length > 0 && (
          <div
            className={[styles.btnDelete, 'canPress'].join(' ')}
            onClick={() => {
              setPlannedChanges({
                ...getPlannedChanges(),
                [textboxContent.network]: ''
              })
              setTextboxContent({ network: '', address: '' })
            }}
          >
            delete old
          </div>
        )}
        <div className={styles.editorNetwork}>
          <aside>Network</aside>
          <textarea
            spellCheck={false}
            value={textboxContent.network}
            placeholder={'e.g. btc'}
            onChange={e => {
              const cleanText = sanitize(e.target.value, [
                'oneline',
                'no_spaces'
              ])
              setTextboxContent({ ...textboxContent, network: cleanText })
            }}
          ></textarea>
        </div>
        <div className={styles.editorAddress}>
          <aside>Forwarding address</aside>
          <textarea
            spellCheck={false}
            value={textboxContent.address}
            placeholder={'e.g. your btc address'}
            onChange={e => {
              const cleanText = sanitize(e.target.value, [
                'oneline',
                'no_spaces'
              ])
              setTextboxContent({ ...textboxContent, address: cleanText })
              console.log('forwarding sanitized:', '"' + cleanText + '"')
            }}
          ></textarea>
        </div>
        <div
          className={[
            'btnCircle',
            styles.btnAdd,
            'canPress',
            'addTooltip'
          ].join(' ')}
          onClick={() => {
            if (textboxContent.network !== '') {
              setPlannedChanges({
                ...getPlannedChanges(),
                [textboxContent.network]: textboxContent.address
              })
              setTextboxContent({ network: '', address: '' })
            }
          }}
        >
          <span>+</span>
          <aside>Add to planned changes</aside>
        </div>
      </div>
      <div className={styles.pastList}>
        <Details description={'Current forwards (expand for info):'}>
          <p>
            Enter the forwarding addresses you want to use (e.g. long bitcoin
            address) and specify on which network that address should be used
            (e.g. btc) when someone wants to reach you after looking up your
            domain alias.
            <br />
            <br />
            Submit new updates by hitting [+] button. Remove updates by hitting
            [x] buttons.
            <br />
            <br />
            Below, the currently active forwarding addresses are shown, if any.
            <br />
            <br />
            Edit them by reusing the exact same network or remove by setting
            forwarding address to nothing or hitting [delete old] button under
            network name text.
          </p>
        </Details>
        {pastForwards.map((fw: any, i: number) => {
          return (
            <div
              className={styles.pastPair}
              key={i}
              onClick={() => {
                setTextboxContent({ network: fw.network, address: fw.address })
              }}
            >
              <div className={styles.pastNetwork}>{fw.network}</div>
              <div className={styles.pastAddress}>{fw.address}</div>
            </div>
          )
        })}
      </div>
      <div className={styles.buttonWrapper}>
        <RoundButton
          back='true'
          onClick={() => {
            changePageInfoAction(state, dispatch, 4)
          }}
        >
          Back
        </RoundButton>
        <RoundButton
          next='true'
          show={bytesOfChanges > BYTES_MAX ? 'false' : 'true'}
          onClick={() => {
            changePageInfoAction(state, dispatch, 6)
          }}
        >
          Ready
        </RoundButton>
        {/* if no stealth address, show button */}
        {/* (TODO) replace with constant for this type of network */}
        {!pastForwards.some(fw => fw.network === '?') && (
          <RoundButton
            colorbutton={'var(--colorHighlightDark)'}
            onClick={() => {
              console.log('stealth address button clicked')
            }}
          >
            Add a stealth address
          </RoundButton>
        )}
      </div>
    </div>
  )
}
