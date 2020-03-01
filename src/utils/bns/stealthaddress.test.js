import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
import bs58check from 'bs58check'
import { ecies } from './../../helpers/bns'
import crypto from 'crypto'

// heavily borrowing from bip47 but
// implemented for BNS
// not use a known nofication address of Bob, generic instead

// const TESTNET_NOTIFICATION_ADDRESS = 'tb1qh4px7esnex25w089wypjq5jqwgwcxcszkmfwl68dsltyp8rtyfrs3gu002'
// const MAINNET_NOTIFICATION_ADDRESS = 'bc1qh4px7esnex25w089wypjq5jqwgwcxcszkmfwl68dsltyp8rtyfrsxq2q49'

const BOB_ADDRESS = 'tb1q2t7tc7nta5ul6xzd7682jgstxwkap2uflrgu4s'

describe('stealth address implementation', () => {
  /* -------------------------------------------------------------------------- */
  /*                            Alice generating xpub                           */
  /* -------------------------------------------------------------------------- */

  const network = bitcoin.networks.testnet

  const Alice_strMnemonic =
    'grace buddy scene leisure strategy spike hair mammal vanish butter hint olive'
  const Alice_seedBuffer = bip39.mnemonicToSeed(Alice_strMnemonic)
  const Alice_masterNode = bitcoin.bip32.fromSeed(Alice_seedBuffer, network)
  const Alice_childNode_m_1001h_0h_0h = Alice_masterNode.derivePath(
    "m/1001'/0'/0'"
  )
  const Alice_childNode_m_1001h_0h_0h_neutered = Alice_childNode_m_1001h_0h_0h.neutered()

  const Alice_xPub_B58 = Alice_childNode_m_1001h_0h_0h_neutered.toBase58()
  const Alice_xPub_Buffer = bs58check.decode(Alice_xPub_B58)

  // this xPub is a payment code Alice can share in order to get paid
  // Assume Alice embedded xPubBuffer in a tx as a forward for Alice's domain

  test('Alice xpub buffer is a buffer', () => {
    expect(Buffer.isBuffer(Alice_xPub_Buffer)).toEqual(true)
  })

  /* -------------------------------------------------------------------------- */
  /*                     Alice uploads xPub (binary) to BNS                     */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                    Bob gets xPub from alice.btc on BNS                     */
  /* -------------------------------------------------------------------------- */

  // Bob gets the xpub
  const Bob_xPub_Buffer_OfAlice = Alice_xPub_Buffer

  // Bob now needs to calculate Alice's public key to encrypt notification with

  // xpub buffer -> base58
  const Bob_xPub_B58_OfAlice = bs58check.encode(Bob_xPub_Buffer_OfAlice)
  // xpub base58 -> bip32 wallet node
  const Bob_walletNode_OfAlice = bitcoin.bip32.fromBase58(
    Bob_xPub_B58_OfAlice,
    network
  )
  // bip 32 wallet node -> alice's public key buffer
  const Bob_publicKey_Buffer_OfAlice = Bob_walletNode_OfAlice.publicKey

  // Bob now has the public key to use

  // Bob prepares the secret he'll share with Alice
  // The secret will be encrypted with Alice's public key
  // Only Alice will be able to decrypt it with Alice's private key
  // Alice can then use the decrypted secret to find all transactions from Bob to Alice

  const Bob_sharedSecret = crypto.randomBytes(32) // random 32 bytes (256 bits)

  // to keep encryption unique we use a deterministic unique nonce/iv which is
  // derived (sha256(string).slice(0,16)) from utf8 string :
  //
  //   (source address)
  //   + (destination public key hex)
  //   + (height of last confirmed notification from this address or 0)
  //
  // which can be easily checked for any source address by scanning notification address

  const Bob_stringForIv =
    BOB_ADDRESS + Bob_walletNode_OfAlice.publicKey.toString('hex') + '0'

  const Bob_eciesOptions = {
    curveName: 'secp256k1',
    symmetricCypherName: 'aes-256-ctr',
    toIv: Bob_stringForIv
  }

  // encrypt with ecies using Alice's public key, aes256ctr, secp256k1, and string for iv
  const Bob_encryptedSecret = ecies.encrypt(
    Bob_publicKey_Buffer_OfAlice,
    Bob_sharedSecret,
    Bob_eciesOptions
  )

  // check encryption worked
  test('Encryption resulted in a buffer', () => {
    console.log('Bob_stringForIv:', Bob_stringForIv)
    expect(Buffer.isBuffer(Bob_encryptedSecret)).toEqual(true)
  })
  test('Encryption byte size non-0', () => {
    console.log('Bob_encryptedSecret.length:', Bob_encryptedSecret.length)
    expect(Bob_encryptedSecret.length > 0).toEqual(true)
  })
  test('Encryption byte size <=80', () => {
    expect(Bob_encryptedSecret.length <= 80).toEqual(true)
  })

  // if the secret is encrypted and fits in 80 bytes Bob can embed this in the transaction
  // bob can send to Alice within same transaction as notification or at another time

  // Bob creates a function to derive a new address of Alice from secret we only have to share once and a counter of times Bob has sent to Alice using this method.

  const getSharedSecretNode = ({ xNodeCodeBuffer, sharedSecret, network }) => {
    // have to do this ideally only once since it takes a few seconds
    console.time('deriveStealthAddressParent')

    // get wallet node
    // xPub buffer -> xpub base58 -> bip32 wallet node
    const xPub58 = bs58check.encode(xNodeCodeBuffer)
    const walletNode = bitcoin.bip32.fromBase58(xPub58, network)
    // derive path based on sharedSecret (one we only have to share once)
    // largest number for each path is < 0x80000000 or 2147483647 (2^31 - 1)
    // secret is 32 bytes or 256 bits
    // we split secret into 16 separate 16 bit (2 byte) paths
    let subPathFromNode = ''
    for (let i = 0; i < 16; i++) {
      // get 16 bytes of secret
      const thisStepPathBuffer = sharedSecret.slice(i * 2, (i + 1) * 2)
      // convert to integer string (read buffer as big endian)
      const thisStepPathIntString = thisStepPathBuffer.readUInt16BE().toString()
      // add to path string
      subPathFromNode += thisStepPathIntString + '/'
    }
    // remove last '/'
    subPathFromNode = subPathFromNode.slice(0, -1)

    // lets get node along the path we can reuse
    const reusableNode = walletNode.derivePath(subPathFromNode)

    // convert to base58 encoding to easily store as string
    const reusableNode58 = reusableNode.toBase58()

    console.timeEnd('deriveStealthAddressParent')
    return {
      base58check: reusableNode58,
      path: subPathFromNode,
      node: reusableNode
    }
  }

  // once we calculate reusable node xpub from shared secret
  // and recepients public node key, getting its children with
  // 1 more path from count of times sent to them should be fast.
  const getStealthAddress = ({ sharedSecretXPub58, timesSent, network }) => {
    console.time('deriveNewStealthAddress')

    if (typeof timesSent !== 'number')
      throw new Error('Must have timesSent: number')

    const sharedSecretNode = bitcoin.bip32.fromBase58(
      sharedSecretXPub58,
      network
    )

    const oneTimeUseNode = sharedSecretNode.derive(timesSent)

    const pubkey = oneTimeUseNode.publicKey

    const newStealthAddress = bitcoin.payments.p2wpkh({ pubkey, network })
      .address

    console.timeEnd('deriveNewStealthAddress')

    return newStealthAddress
  }

  // calculate reusable parent node after shared secret path derivation
  const Bob_calculateAliceSharedSecretXPub = getSharedSecretNode({
    xNodeCodeBuffer: Bob_xPub_Buffer_OfAlice, // found posted on BNS - 78 byte long static xpub
    sharedSecret: Bob_sharedSecret, // Bob's secret only Alice can find on blockchain
    network // bitcoin.networks['bitcoin' or 'testnet']
  })

  console.log(
    'Bob can store string to skip shared secret node derivation for sending to Alice (xpub in base58check):\n',
    Bob_calculateAliceSharedSecretXPub.base58check
  )

  // first time sending so 0, increase by 1 each time we send to Alice's stealth address
  let timesSent = 0

  const Bob_calculateAliceStealthAddress0 = getStealthAddress({
    sharedSecretXPub58: Bob_calculateAliceSharedSecretXPub.base58check,
    timesSent: timesSent++,
    network
  })

  const Bob_calculateAliceStealthAddress1 = getStealthAddress({
    sharedSecretXPub58: Bob_calculateAliceSharedSecretXPub.base58check,
    timesSent: timesSent++,
    network
  })

  const Bob_calculateAliceStealthAddress2 = getStealthAddress({
    sharedSecretXPub58: Bob_calculateAliceSharedSecretXPub.base58check,
    timesSent: timesSent++,
    network
  })

  /* -------------------------------------------------------------------------- */
  /*            Assume Bob posted secret and sent to these addresses            */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                 Alice returns and checks for notifications                 */
  /* -------------------------------------------------------------------------- */

  // Simulating reading data from blockchain.
  // The following data was found embedded in random transactions.
  // Generating 3 nonsense messages and 1 real
  const potentialNotifications = [
    { data: crypto.randomBytes(Bob_encryptedSecret.length), from: BOB_ADDRESS },
    { data: crypto.randomBytes(Bob_encryptedSecret.length), from: 'voldemort' },
    { data: Bob_encryptedSecret, from: BOB_ADDRESS },
    {
      data: crypto.randomBytes(Bob_encryptedSecret.length),
      from: BOB_ADDRESS.split()
        .reverse()
        .join()
    }
  ]

  // since "m/1001'/0'/0'" public key was used for encryption
  // "m/1001'/0'/0'" private key should work for decryption
  const aliceNotificationKeyNode = Alice_childNode_m_1001h_0h_0h
  const privateKeyBuffer = aliceNotificationKeyNode.privateKey

  // track if found
  let nFound = 0
  let sharedSecretBuffer

  potentialNotifications.forEach(tx => {
    // options for decryption
    const Alice_eciesOptions = {
      curveName: 'secp256k1',
      symmetricCypherName: 'aes-256-ctr',
      toIv: tx.from + aliceNotificationKeyNode.publicKey.toString('hex') + '0'
    }

    const decryptAttempt = ecies.decrypt(
      privateKeyBuffer,
      tx.data,
      Alice_eciesOptions
    )

    if (decryptAttempt) {
      nFound++
      console.log(
        'Secret found from',
        tx.from,
        'with byte size of',
        decryptAttempt.length
      )
      sharedSecretBuffer = decryptAttempt
    }
  })

  test('Alice can find 1 valid notification among 4', () => {
    expect(nFound).toEqual(1)
  })

  test('Alice derived same clear text that Bob encrypted', () => {
    expect(sharedSecretBuffer).toEqual(Bob_sharedSecret)
  })

  /* -------------------------------------------------------------------------- */
  /*               Alice derives key pair for each stealth address              */
  /* -------------------------------------------------------------------------- */

  // shared secret node derivation can use same function as Bob used
  const Alice_sharedSecretNode = getSharedSecretNode({
    xNodeCodeBuffer: bs58check.decode(Alice_childNode_m_1001h_0h_0h.toBase58()), // from node I derived from my private mnemonic
    sharedSecret: sharedSecretBuffer, // Alice found on chain & it passed checksum after decryption
    network
  })

  // get private key (WIF format) for first 3 child nodes of shared secret node
  const Alice_StealthAddress0_WIF = Alice_sharedSecretNode.node
    .derive(0)
    .toWIF()
  const Alice_StealthAddress1_WIF = Alice_sharedSecretNode.node
    .derive(1)
    .toWIF()
  const Alice_StealthAddress2_WIF = Alice_sharedSecretNode.node
    .derive(2)
    .toWIF()

  // get key pairs
  const Alice_StealthAddress0_keyPair = bitcoin.ECPair.fromWIF(
    Alice_StealthAddress0_WIF,
    network
  )
  const Alice_StealthAddress1_keyPair = bitcoin.ECPair.fromWIF(
    Alice_StealthAddress1_WIF,
    network
  )
  const Alice_StealthAddress2_keyPair = bitcoin.ECPair.fromWIF(
    Alice_StealthAddress2_WIF,
    network
  )

  // get addresses
  const Alice_StealthAddress0 = bitcoin.payments.p2wpkh({
    pubkey: Alice_StealthAddress0_keyPair.publicKey,
    network
  }).address
  const Alice_StealthAddress1 = bitcoin.payments.p2wpkh({
    pubkey: Alice_StealthAddress1_keyPair.publicKey,
    network
  }).address
  const Alice_StealthAddress2 = bitcoin.payments.p2wpkh({
    pubkey: Alice_StealthAddress2_keyPair.publicKey,
    network
  }).address

  console.log(
    `Shared (once) secret + Alice's xpub lead to these paths from Alice's master node:`,
    '\n',
    "Full path 0: m/1001'/0'/0'/" + Alice_sharedSecretNode.path + '/0)',
    '\n',
    "Full path 1: m/1001'/0'/0'/" + Alice_sharedSecretNode.path + '/1)',
    '\n',
    "Full path 2: m/1001'/0'/0'/" + Alice_sharedSecretNode.path + '/2)',
    '\n'
  )

  console.log(
    'Bob calculated 3 stealth addresses to send to from Alice xpub and shared secret:\n',
    Bob_calculateAliceStealthAddress0,
    '\n',
    Bob_calculateAliceStealthAddress1,
    '\n',
    Bob_calculateAliceStealthAddress2,
    '\n'
  )

  console.log(
    'Alice attempted to derive those same 3 stealth addresses with private keys for each from decrypted secret message:\n',
    Alice_StealthAddress0,
    'with private key (WIF):',
    Alice_StealthAddress0_WIF,
    '\n',
    Alice_StealthAddress1,
    'with private key (WIF):',
    Alice_StealthAddress1_WIF,
    '\n',
    Alice_StealthAddress2,
    'with private key (WIF):',
    Alice_StealthAddress2_WIF,
    '\n'
  )

  test('Alice addresses 0,1,2 matched Bob addresses 0,1,2', () => {
    expect(Alice_StealthAddress0).toEqual(Bob_calculateAliceStealthAddress0)
    expect(Alice_StealthAddress1).toEqual(Bob_calculateAliceStealthAddress1)
    expect(Alice_StealthAddress2).toEqual(Bob_calculateAliceStealthAddress2)
  })
})
