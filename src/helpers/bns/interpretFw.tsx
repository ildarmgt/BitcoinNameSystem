/**
 * Reads a single forward info object to interpret its values
 * as where the forwarding address should be used, what it is, and what link to use.
 * Returns {what: string, where: string, link: string, render: boolean}.
 */
export function interpretFw (
  fw: { network: string, address: string, updateHeight: number, updateTimestamp: number }
) {
  // blank address means it was removed
  if (fw.address === '') {
    return {
      render: false
    }
  }

  if (fw.network === 'p2wsh' || fw.network === 'btc') {
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

  if (fw.network === 'http' || fw.network === 'https' || fw.network === 'url' || fw.network === 'web') {
    return {
      where: 'https://',
      what: fw.address,
      link: 'https://' + fw.address,
      render: true
    }
  }

  if (fw.network === 'twitter') {
    return {
      where: 'twitter.com/',
      what: fw.address,
      link: 'https://twitter.com/' + fw.address,
      render: true
    }
  }

  if (fw.network === 'github') {
    return {
      where: 'github.com/',
      what: fw.address,
      link: 'https://github.com/' + fw.address,
      render: true
    }
  }

  if (fw.network === 'youtube') {
    return {
      where: 'youtu.be/',
      what: fw.address,
      link: 'https://www.youtube.com/watch?v=' + fw.address,
      render: true
    }
  }

  // if unknown forward network, no link, and the rest is shown as is
  return {
    where: fw.network,
    what: fw.address,
    link: undefined,
    render: true
  }
}
