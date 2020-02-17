import { I_Forward } from '../types'
/**
 * Reads a single forward info object to interpret its values
 * as where the forwarding address should be used, what it is, and what link to use.
 * Returns {what: string, where: string, link: string, render: boolean}.
 */
export function interpretFw (fw: I_Forward) {
  // blank address means it was removed
  // ! at start means it's a command, not a network
  if (fw.network === '' || fw.address === '' || fw.network.startsWith('!')) {
    return {
      render: false
    }
  }

  // remove version modifier (anything after ! after network)
  const onNetwork = fw.network.split('!')[0]

  if (
    onNetwork === 'p2wsh' ||
    onNetwork === 'btc' ||
    onNetwork === 'p2pkh' ||
    onNetwork === 'p2wpkh' ||
    onNetwork === 'p2sh'
  ) {
    return {
      where: 'btc:',
      what: (
        fw.address
      ),
      link: (
        'https://blockstream.info/address/' + fw.address
      ),
      render: true
    }
  }

  if (
    onNetwork === 'http' ||
    onNetwork === 'https' ||
    onNetwork === 'url' ||
    onNetwork === 'web'
  ) {
    return {
      where: 'https://',
      what: fw.address,
      link: 'https://' + fw.address,
      render: true
    }
  }

  if (onNetwork === 'twitter') {
    return {
      where: 'twitter.com/',
      what: fw.address,
      link: 'https://twitter.com/' + fw.address,
      render: true
    }
  }

  if (onNetwork === 'github') {
    return {
      where: 'github.com/',
      what: fw.address,
      link: 'https://github.com/' + fw.address,
      render: true
    }
  }

  if (onNetwork === 'youtube') {
    return {
      where: 'youtu.be/',
      what: fw.address,
      link: 'https://www.youtube.com/watch?v=' + fw.address,
      render: true
    }
  }

  // if unknown forward network, no link, and the rest is shown as is
  console.log({
    originawhere: fw.network,
    where: onNetwork,
    what: fw.address,
    link: undefined,
    render: true
  })
  return {
    where: onNetwork,
    what: fw.address,
    link: undefined,
    render: true
  }
}
