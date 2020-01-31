import * as bitcoin from 'bitcoinjs-lib'
const op = bitcoin.opcodes;
const hash160 = bitcoin.crypto.hash160;


/**
 * Get p2wsh notificaiton address from domainName and network.
 * @param   {string} domainName         - full domainName to use (e.g. 'satoshi.btc').
 * @param   {string} networkChoice      - 'testnet' or 'bitcoin' (matches bitcoinjs-lib).
 * @returns {object}                    - { notificationsAddress - p2wsh address derived from domainName }.
 */
export const calcP2WSH = (domainName: string, networkChoice: string) => {
  const network = bitcoin.networks[networkChoice];

  // convert domainName into buffer so it can be put into script
  const bufferData = Buffer.from(domainName, 'utf8');

  // easily spendable script for ACS notification output
  // specific to this domainName
  const witnessScript = bitcoin.script.compile([
    hash160(bufferData),
    op.OP_DROP
  ]);

  // calculate p2wsh address for this witnessScript & network
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: {
      output: witnessScript,
      network
    },
    network
  })
  const notificationsAddress = p2wsh.address;

  return {
    notificationsAddress
  };
}
