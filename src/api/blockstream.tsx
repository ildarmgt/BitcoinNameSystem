import axios from 'axios'

// Documentation
// https://github.com/Blockstream/esplora/blob/esplora_v2.00/API.md
// https://github.com/Blockstream/esplora/blob/master/API.md#post-tx

// const API_PATH_TESTNET = 'https://blockstream.info/testnet/api/'
// const API_PATH_BITCOIN = 'https://blockstream.info/api/'

const API_RATE_LIMIT = 0.5 // guessing calls per second cap

// (TODO) a single instance of async task executing loop per API to ensure rate limit holds per API
// Meanwhile calling function can use its own busy flag to ensure promises are resolved before repeats.
// RawTx requests and multipage history (length > 25) are main risks.

/* -------------------------------------------------------------------------- */
/*                             getFeeEstimatesAPI                             */
/* -------------------------------------------------------------------------- */

export async function getFeeEstimatesAPI(
  strNetwork: string,
  path: { [network: string]: string }
) {
  const API_PATH = path[strNetwork] + 'fee-estimates'
  console.warn(API_PATH)

  try {
    const res = await axios.get(API_PATH)
    console.warn('Blockstream.info API getFeeEstimates', res.data)

    return res.data
  } catch (e) {
    console.warn(e)

    throw new Error('Blockstream.info API getFeeEstimates failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                                getHeightAPI                                */
/* -------------------------------------------------------------------------- */

export async function getHeightAPI(
  strNetwork: string,
  path: { [network: string]: string }
) {
  const API_PATH = path[strNetwork] + 'blocks/tip/height'
  console.warn(API_PATH)

  try {
    const res = await axios.get(API_PATH)
    console.warn('Blockstream.info API getHeight', res.data)

    return res.data
  } catch (e) {
    console.warn(e)

    throw new Error('Blockstream.info API height get failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                             addRawTxToArrayAPI                             */
/* -------------------------------------------------------------------------- */

/**
 * API request for each UTXO in array to get the raw tx necessary for psbt.
 * @param     {Array}     arrayUtxo       Array of UTXO.
 * @param     {string}    strNetwork      Network type: 'bitcoin' or 'testnet'.
 * @returns   {object}                    { arrayTx: arrayTx w/ .hex, error: string, fails: number }
 */
export async function addRawTxToArrayAPI(
  utxoList: Array<any>,
  strNetwork: string,
  path: { [any: string]: string },
  delay: () => void = msDelay
) {
  if (utxoList === undefined)
    throw new Error('undefined utxoList when addRawTxToArray was called')

  // to track failures indecies
  let erroredOutputs = ''

  // abort if empty array
  if (utxoList?.length === 0) {
    return { utxoList, error: 'no utxo' }
  }

  // iterate through original utxo and add hex onto clone, 2 tries max each
  // (changed let to const in for of loop)
  for (const [indexString, utxo] of Object.entries(utxoList)) {
    // indexString is a string so convert for array index use
    const index = parseInt(indexString, 10)

    let tries = 2
    while (tries-- > 0) {
      try {
        const { txid } = utxo

        // raw tx hex path on API
        const API_PATH = path[strNetwork] + 'tx/' + txid + '/hex'
        console.warn(API_PATH)

        const res = await axios.get(API_PATH)
        console.warn(
          'Blockstream.info API addRawTxToArray:',
          index,
          'index utxo has raw hex of',
          res.data
        )

        // add hex data into cloned utxo array
        utxoList[index].hex = res.data

        // break while loop if got data, don't need more tries
        break
      } catch (e) {
        // keeping track of failures
        console.warn(
          'fail detected',
          indexString,
          utxo,
          tries,
          erroredOutputs,
          e
        )
        // keep track of indecies missing hex
        erroredOutputs += indexString + ' '
      }

      // since each utxo is separate call, injected delay very important here
      await delay()
    }
  }

  // return summary object
  return { utxoList, erroredOutputs }
}

/* -------------------------------------------------------------------------- */
/*                               getUTXOListAPI                               */
/* -------------------------------------------------------------------------- */

/**
 * API request for all utxo for this address.
 * Blockstream utxo do not have addresses that created them!
 * @param     {string}    address       Bitcoin address.
 * @param     {string}    strNetwork    Network type: 'bitcoin' or 'testnet'.
 * @returns   {Array}                   Array of UTXO.
 */
export async function getUTXOListAPI(
  address: string,
  strNetwork: string,
  path: { [any: string]: string }
) {
  if (address === undefined || address === '')
    throw new Error('no address when getUTXOList called')

  const API_PATH = path[strNetwork] + 'address/' + address + '/utxo'
  console.warn(API_PATH)

  try {
    const res = await axios.get(API_PATH)
    console.warn('Blockstream.info API getUTXOList', res.data)

    // for now lets filter out the unconfirmed tx
    return res.data.filter((utxo: any) => utxo.status.confirmed)
  } catch (e) {
    console.warn(e)

    throw new Error('Blockstream.info API access failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                            getAddressHistoryAPI                            */
/* -------------------------------------------------------------------------- */

/**
 * API request all transactions for a specific address.
 * parameters: (address, network).
 * @param   {string} address    - address on network.
 * @param   {string} network    - 'testnet' or 'bitcoin' to match bitcoinjs-lib.
 * @returns {Array<object>}     -  Array of tx objects.
 */
export async function getAddressHistoryAPI(
  address: string,
  strNetwork: string,
  path: { [any: string]: string }
) {
  if (address === undefined || address === '')
    throw new Error('no address when getAddressHistory called')
  // https://blockstream.info/testnet/api/address/tb1qprkzdaqt5jkxrhy57ngvra8k0rvq63ulksz8cx85qwke3myhjrtq9s6nj3/txs/chain
  // GET /address/:address/txs/chain[/:last_seen_txid]
  // Get confirmed transaction history for the specified address/scripthash, sorted with newest first.
  // Returns 25 transactions per page. More can be requested by specifying the last txid seen by the previous query.

  const CONFIRMED_PAGES_ADDON = '/txs/chain'
  const API_PATH =
    path[strNetwork] + 'address/' + address + CONFIRMED_PAGES_ADDON
  console.warn(API_PATH)

  try {
    const res = await axios.get(API_PATH)
    console.warn('blockstream.info API getAddressHistory', res.data)

    return res.data
  } catch (e) {
    console.warn(e)
    throw new Error('Blockstream.info API access failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                                  txPushAPI                                 */
/* -------------------------------------------------------------------------- */

/**
 * Broadcasts content onto the blockchain.
 * parameters: (content, network).
 * @param   {string}  content  - raw hex content of transaction.
 * @param   {string}  network  - 'testnet' or 'bitcoin' to match bitcoinjs-lib.
 * @returns {string}           - Successful broadcast returns txid, otherwise error reason.
 */
export async function txPushAPI(
  content: string,
  strNetwork: string,
  path: { [any: string]: string }
) {
  if (content === undefined || content === '')
    throw new Error('no content when txPush called')

  const API_PATH = path[strNetwork] + 'broadcast'

  try {
    const res = await axios.get(API_PATH, {
      params: {
        tx: content
      }
    })

    // console.warn(res)
    console.warn(
      'blockstream.info API txPush',
      res,
      ' Broadcasted on',
      strNetwork
    )

    // returns txid on success
    return { txid: res.data }
  } catch (e) {
    console.warn('Failed pushtx', strNetwork, e.response.data)

    throw new Error('Blockstream.info API access failed\n' + e.response.data)
  }
}

const msDelay = (msDelay = 1000.0 / API_RATE_LIMIT) =>
  new Promise(r => setTimeout(r, msDelay))
