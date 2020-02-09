import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
const varuint = require('varuint-bitcoin');


/**
 * Scans the address for utxo on a given network.
 * (In BNS would be useful for wallet and notification address)
 */
// export const scanAddress = async (address: string, strNetwork: string) => {
  // create array of utxo


  // add full tx hex to that array (might take time)
// }

/**
 * Make new mnemonic for p2wpkh m/44'/0'/0'/0/0 address and WIF.
 * @param     {string}    strNetwork    String describing network ('bitcoin', 'testnet').
 * @returns   {object}                  Object { mnemonic, WIF, address } - all strings.
 */
export const createNewWallet = (strNetwork: string) => {
  // network version. bitcoin or testnet
  const network = bitcoin.networks[strNetwork]
  // create backup phrase
  const mnemonic = bip39.generateMnemonic()
  const seedBuffer = bip39.mnemonicToSeed(mnemonic)
  // create derivation master node
  const masterNode = bitcoin.bip32.fromSeed(seedBuffer, network)
  // derive m/44'/0'/0'/0 /0 node
  const childNode0 = masterNode.derivePath("m/44'/0'/0'").derivePath("0/0")
  // get private key in wallet import format for that child node
  const WIF = childNode0.toWIF()
  // derive a standard p2wpkh address from that WIF
  const keyPair = bitcoin.ECPair.fromWIF(WIF, network)
  const address = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address

  return { mnemonic, WIF, address }
}

/**
 * Load p2wpkh m/44'/0'/0'/0/0 wallet info from mnemonic.
 * @param     {string}    strMnemonic     Mnemonic string of 12 words as described in bip39.
 * @param     {string}    strNetwork      String describing network ('bitcoin', 'testnet').
 * @returns   {object}                    Object { mnemonic, WIF, address } - all strings.
 */
export const loadWallet = (strMnemonic: string, strNetwork: string) => {
  // network version. bitcoin or testnet
  const network = bitcoin.networks[strNetwork]
  const seedBuffer = bip39.mnemonicToSeed(strMnemonic)
  // create derivation master node
  const masterNode = bitcoin.bip32.fromSeed(seedBuffer, network)
  // derive m/44'/0'/0'/0 /0 node
  const childNode0 = masterNode.derivePath("m/44'/0'/0'").derivePath("0/0")
  // get private key in wallet import format for that child node
  const WIF = childNode0.toWIF()
  // derive a standard p2wpkh address from that WIF
  const keyPair = bitcoin.ECPair.fromWIF(WIF, network)
  const address = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address

  return { mnemonic: strMnemonic, WIF, address }
}


//
/**
 * Parse UTXO array to get total unspent balance in satoshi.
 * @param     {Array}    utxoArray      Array of UTXO objects with '.value' field in satoshi.
 * @returns   {number}                  Total number of unspent satoshi.
 */
export function getUnspentSum(utxoArray: Array<any>): number {

  const sumSats = utxoArray?.reduce(
    (sum: number, utxo: any) => sum + utxo.value
    , 0) || 0

  return sumSats
}


/**
 * Finalize outputs that require custom scripts.
 * Based on based on https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/csv.spec.ts
 */
export const getFinalScripts = ({ inputScript, network }: any) => {
  return function (
    inputIndex: number,
    input: any,
    script: Buffer,
    isSegwit: boolean,
    isP2SH: boolean,
    isP2WSH: boolean,
  ): {
    finalScriptSig: Buffer | undefined;
    finalScriptWitness: Buffer | undefined;
  } {
    // Step 1: Check to make sure the meaningful script matches what you expect.

    // Step 2: Create final scripts
    let payment: any = {
      network,
      output: script,
      input: inputScript,
    };
    if (isP2WSH && isSegwit)
      payment = bitcoin.payments.p2wsh({
        network,
        redeem: payment,
      });
    if (isP2SH)
      payment = bitcoin.payments.p2sh({
        network,
        redeem: payment,
      });

    function witnessStackToScriptWitness(witness: Buffer[]): Buffer {
      let buffer = Buffer.allocUnsafe(0);

      function writeSlice(slice: Buffer): void {
        buffer = Buffer.concat([buffer, Buffer.from(slice)]);
      }

      function writeVarInt(i: number): void {
        const currentLen = buffer.length;
        const varintLen = varuint.encodingLength(i);

        buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)]);
        varuint.encode(i, buffer, currentLen);
      }

      function writeVarSlice(slice: Buffer): void {
        writeVarInt(slice.length);
        writeSlice(slice);
      }

      function writeVector(vector: Buffer[]): void {
        writeVarInt(vector.length);
        vector.forEach(writeVarSlice);
      }

      writeVector(witness);

      return buffer;
    }

    return {
      finalScriptSig: payment.input,
      finalScriptWitness:
        payment.witness && payment.witness.length > 0
          ? witnessStackToScriptWitness(payment.witness)
          : undefined,
    };
  }
}