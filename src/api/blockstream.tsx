import axios from 'axios'

// Documentation
// https://github.com/Blockstream/esplora/blob/esplora_v2.00/API.md
// https://github.com/Blockstream/esplora/blob/master/API.md#post-tx

const API_PATH_TESTNET = 'https://blockstream.info/testnet/api/'
const API_PATH_BITCOIN = 'https://blockstream.info/api/'
const API_RATE_LIMIT = 0.6    // guessing calls per second cap

// (TODO) a single instance of async task executing loop per API to ensure rate limit holds per API
// Meanwhile calling function can use its own busy flag to ensure promises are resolved before repeats.
// RawTx requests and multipage history (length > 25) are main risks.


export async function getHeight (strNetwork: string) {
  const API_PATH = (
    (strNetwork === 'testnet')
    ? API_PATH_TESTNET
    : API_PATH_BITCOIN
  ) + 'blocks/tip/height'
  console.log(API_PATH)

  try {

    const res = await axios.get(API_PATH)
    console.log('getHeight', res.data)
    return res.data

  } catch (e) {

    console.log(e)
    await rateLimit()
    throw new Error('Blockstream.info API height get failed')
  }

}

/**
 * API request for each UTXO in array to get the raw tx necessary for psbt.
 * @param     {Array}     arrayUtxo       Array of UTXO.
 * @param     {string}    strNetwork      Network type: 'bitcoin' or 'testnet'.
 * @returns   {object}                    { arrayTx: arrayTx w/ .hex, error: string, fails: number }
 */
export async function addRawTxToArray (arrayUtxo: Array<any>, strNetwork: string) {
  // to track failures indecies
  let erroredOutputs = ''

  // abort if empty array
  if (arrayUtxo?.length === 0) { return { arrayUtxo, error: 'no utxo' } }

  // clone array
  const arrayUtxoWithHex = [...arrayUtxo]

  // iterate through original utxo and add hex onto clone, 2 tries max each
  for (const [indexString, utxo] of Object.entries(arrayUtxo)) {
    // indexString is a string so convert for array index use
    const index = parseInt(indexString, 10)

    let tries = 2
    while (tries-- > 0) {
      try {
        const { txid } = utxo

        // raw tx hex path on API
        const API_PATH = (
          (strNetwork === 'testnet')
            ? API_PATH_TESTNET
            : API_PATH_BITCOIN
        ) + 'tx/' + txid + '/hex'
        console.log(API_PATH)

        const res = await axios.get(API_PATH)

        console.log(index, 'index utxo has raw hex of', res.data)

        // add hex data into cloned utxo array
        arrayUtxoWithHex[index].hex = res.data

        // break while loop if got data, don't need more tries
        break

      } catch(e) {
        // keeping track of failures
        console.log('fail detected', indexString, utxo, tries, erroredOutputs, e)
        // keep track of indecies missing hex
        erroredOutputs += indexString + ' '
      }

      await rateLimit()
    }
  }

  // return summary object
  return { arrayUtxoWithHex, erroredOutputs }
}

/**
 * API request for all utxo for this address
 * @param     {string}    address       Bitcoin address.
 * @param     {string}    strNetwork    Network type: 'bitcoin' or 'testnet'.
 * @returns   {Array}                   Array of UTXO.
 */
export async function getUTXOList (address: string, strNetwork: string) {
  const API_PATH = (
    (strNetwork === 'testnet')
    ? API_PATH_TESTNET
    : API_PATH_BITCOIN
  ) + 'address/' + address + '/utxo'
  console.log(API_PATH)

  try {
    const res = await axios.get(API_PATH)

    console.log('getUTXOList', res.data)

    await rateLimit()

    return res.data

  } catch (e) {

    console.log(e)
    await rateLimit()
    throw new Error('Blockstream.info API access failed')

  }
}

/**
 * API request all transactions for a specific address.
 * parameters: (address, network).
 * @param   {string} address    - address on network.
 * @param   {string} network    - 'testnet' or 'bitcoin' to match bitcoinjs-lib.
 * @returns {Array<object>}     -  Array of tx objects.
 */
export async function getAddressHistory (address: string, network: string) {
  // https://blockstream.info/testnet/api/address/tb1qprkzdaqt5jkxrhy57ngvra8k0rvq63ulksz8cx85qwke3myhjrtq9s6nj3/txs/chain
  // GET /address/:address/txs/chain[/:last_seen_txid]
  // Get confirmed transaction history for the specified address/scripthash, sorted with newest first.
  // Returns 25 transactions per page. More can be requested by specifying the last txid seen by the previous query.

  const CONFIRMED_PAGES_ADDON = '/txs/chain'

  const API_PATH = (
    (network === 'testnet')
    ? API_PATH_TESTNET
    : API_PATH_BITCOIN
  ) + 'address/' + address + CONFIRMED_PAGES_ADDON

  try {
    const res = await axios.get(API_PATH)

    console.log('blockstream.info API address history request', res)
    return res.data

  } catch (e) {
    console.log(e)
    throw new Error('Blockstream.info API access failed')
  }
}

/**
 * Broadcasts content onto the blockchain.
 * parameters: (content, network).
 * @param   {string}  content  - raw hex content of transaction.
 * @param   {string}  network  - 'testnet' or 'bitcoin' to match bitcoinjs-lib.
 * @returns {string}           - Successful broadcast returns txid, otherwise error reason.
 */
export async function txPush (content: string, network: string) {

  // const API_PATH_TESTNET =
  //  'https://blockstream.info/testnet/api/broadcast'

  // const API_PATH_BITCOIN =
  //   'https://blockstream.info/api/broadcast'

  const API_PATH =
    (network === 'testnet')
    ? API_PATH_TESTNET + 'broadcast'
    : API_PATH_BITCOIN + 'broadcast'

  try {
    const res = await axios.get(API_PATH, {
      params: {
        tx: content
      }
    })

    // console.log(res)
    console.log('Broadcasted on', network)

    // returns txid on success
    return { txid: res.data }

  } catch (e) {
    console.log('Failed pushtx', network, e)

    // console.log('error main message:', e.response.data)
    return { error: e.response.data }
  }
}

// Slow down based on rate limit.
// Convert hz to time in milliseconds.
async function rateLimit () {
  return new Promise(r => setTimeout(r, 1000.0 / API_RATE_LIMIT))
}
