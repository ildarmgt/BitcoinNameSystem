# Bitcoin Name System (BNS) (NOT DONE)

On-chain DNS where easy to read domain name (i.e. alias) can be looked up or created to forward to very long alphanumeric Bitcoin addresses or other network's types of addreses (e.g. ipfs, https, twitter) on the most secure public network ever created.

Used: React, TypeScript, Node.js, JavaScript, CSS, HTML.

![pic](https://i.imgur.com/KQtiSHn.png)

This readme and all else is work in progress. I'm open to collaborations.

[Github pages demo (testnet only now)](https://ildarmgt.github.io/BitcoinNameSystem/)

Can also open by domain name alias. e.g. `/BitcoinNameSystem/#/id/satoshi` to [autofill & search](https://ildarmgt.github.io/BitcoinNameSystem/#/id/satoshi).

## To build project from scratch

```
git clone https://github.com/ildarmgt/BitcoinNameSystem.git bns
cd bns
npm i
npm run build
```
The latest compiled release used can be found in `./docs/` folder

Website can eventually run offline by running index.html in `/docs/` folder (w/ rest of files in folder present) for putting together transactions on air-gapped computers.
(Tx creator not done & airgapped offline loading not done. Work in progress)

## To run project on localhost

```
npm start
```

This makes it accessible locally at http://localhost:3000

## Testnet bitcoin faucets (free testnet coins)

https://bitcoinfaucet.uo1.net/send.php (segwit compatible)

## Method used for BNS

Majority of rules will be implemented in this file (possibly future npm library if interest).

`src/helpers/bns.tsx`

Not all rules in code are yet in final version as more complicated rules are introduced.

Until I copy all rules here, basic premise is:

- Only have to request tx history for a single address per domain name.
  This should simplify the task for API & SPV/Neutrino clients

- Anyone can spend outputs used for that, so require cleanup of utxo for it to count.

- domain-name-to-forwarding look-up is one way (one way hash function).

- ~1 year of blocks duration, ~24 hour of blocks challenge period with clean up & reimbersement required.

- Burns are kept small but non-0 (for miners) and at least double on each challenge.

Tons more stuff to list here and do in the app.

Wasn't sure what's better: Bitcoin Name Service, Bitcoin Name System, Bitcoin Name System Service.

## Terminology and definitions

  Example: "`satoshi.btc`" domain name alias could have multiple entries for it including one where for "`twitter`" network "`halfin`" is provided for forwarding address to make it easy to find his twitter account, one where for "`https`" network "`bitcoin.org`" is provided as forwarding address to make it easy to find his home page on the world wide web, and "`btc!p2wsh`" network has a provided forwarding bitcoin address of "`bc1q_FAKE_ADDRESS_e2`".

  **Domain name** - (e.g. "`satoshi.btc`", "`steve.btc`") short easy to read alias that can be used to store multiple network and forwarding address associations.

  **Network** - (e.g. "`https`", "`btc`", "`xmr`", "`twitter`") the network name to explain where the corresponding forwarding address is to be used. Interpretation of each network address is largely left to BNS implementing users/devs.

  **Forwarding address** - (e.g. "`bc1qdem2gqh_FAKE_ADDRESS_6vwy5e2`", "`halfin`", "`bitcoin.org/en/innovation`") the address that the domain name owner would like to be used on the associated network.

  **Forwarding information** - a (key: value) pair of a network and associated forwarding address on on that network. Before encryption and after decryption, the plain text utf8 data is formated as key and value pairs separated by utf8 spaces. e.g. `https bitcoin.org twitter halfin p2wsh bc1q_FAKE_ADDRESS_e2` for { https: 'bitcoin.org', twitter: 'halfin', p2wsh 'bc1q_FAKE_ADDRESS_e2' }.

  **Bid** - Attempt to get an unowned domain name with a challenge period of ~24 hours in block height. The winner of this process gets to be the Owner of this domain name until ownership expires or is given up. (Details TBD)

  **Source address** - The bitcoin address used to interact with domains including being able to control the ones it owns. In transactions, it's the address at input[0]

  **Owner address** - A controlling address that owns a specific domain name based on ownership derivation rules and can control (e.g. can change the networks active forwarding addresses for the domain it owns).

  **Burn** - The act of making some Bitcoin unspendable for everyone so nobody gets an unfair advantage.

  **Notification address** - A pay-to-witness-script-hash (p2wsh) bitcoin address associated with a specific domain name to allow simple look-up of only relevant to this domain name Bitcoin transactions for API clients, SPV/Neutrino Clients, and Full nodes. Payments to the notification address are of type that anyone can spend (ACS). The derivation of the witness script is
  ```
    < hash160 of domain name in utf8 encoding >
    OP_DROP
  ```
  to provide constant length script for alias of any length. HASH160(X) is short for RIPEMD(SHA256(X)) hash functions always resulting in 20 bytes output. To spend the output just need to provide something like OP_TRUE and the witness script. Derivation of everything is trivial when knowing the domain name. Without knowing the domain name and short of making tables for every possible domain name, the domain name is not visible in unspent outputs (utxo) nor in witness scripts or script signatures.
  Strict requirements are placed that require cleaning up these utxo by using them as inputs in order for BNS transactions to be considered valid. These requirements should minimize impact of BNS on utxo sets of Bitcoin nodes. (Details: TBD)

  **Domain history** - Since the domain ownership and changes are publicly accessible and secure data on Bitcoin blockchain, the history of all changes can be displayed and any recent changes in ownership or forwarding addresses can be warned about.

  **Domain security** - Domain ownership is secured by cryptographic signatures and hash functions used by the controlling address and p2wsh address plus the Bitcoin network's censorship resistance and economic finality to block reorganizations. Bitcoin is probably the most secure decentralized network in existence creating the most robust domain security.

  **Domain privacy** - There is no significant privacy possible for this service in order to make forwarding information easy to look up when knowing a domain name.

  Limited privacy is offered with respect to those unaware of the domain name. All domain names are only identified by their hashes on chain, so trying to derive domain name information from on-chain information is difficult. To avoid connecting forwarding information for same domain name without knowing domain name, data in OP_RETURN on chain will be encrypted with AES-256-CRT symmetric encryption method. The key and iv/nonce will be derived from strings so for each owner they are unique & derivable & within their control.
  ```
  (domain name + owner address + (last notification blockheight from this owner address || '0')).
  ```
  Decrypting is trivial with domain name in hand. CRT mode provides the most compact cipher text w/o fixed 16 byte blocks of CBC. This allows 80 bytes for domain name use when embedding data in OP_RETURN type tx.

  The functions encrypt/decrypt are shown in `/src/helpers/cryptography.tsx`.

  No privacy should be expected when sharing domain name as they can be used to derive all the forwarding information. Any privacy for transactions with addresses posted in forwarding information is only expected when those independent implementations offer their own privacy mechanisms such as stealth addresses (XMR) or Bitcoin's [bip47](https://github.com/bitcoin/bips/blob/master/bip-0047.mediawiki) payment codes w/ supporting wallets (e.g. Samourai). I'll tenatively assign `47!p` as standard network key for pruned bip47 payment codes (full length I found to be 81 bytes, can prune 8 of last 12 zero bytes).

  **Reserved character** - special characters that have outside meaning and thus can't be used within network or domain name. At the moment ` ` spaces separate network and addresses so can't be used within them. `!` is to be used for control commands when alone and for interpretation as preceeding extra information when within network name. If your implementation requires it, use another character and replace it on render.

## Payments

This design cannot be entirely free to prevent domains being captured en masse, especially over a challenged domain. Having non zero burn costs, typical fee market costs, limited ownership duration of ~ 1 year, challenge period for ownership ~ 24 hours, & extensions costs equal to winning bid costs should minimize multiple domain squatting, even for miners. Nothing is required to go to me in any way, my costs are same as everyone elses. Miners could try to put their transaction

## What works

* Searching for domain ownership and forwarding information (with simplified rules)

* Encryption and decryption of embedded information (AES-256-CTR)

* Creating or importing wallet from bip39 backup

* Async blockstream.info API calls

* Scanning wallet and notification address for tx history, utxo

* Wallet total unspent balance

## Donations

BTC LN: https://tippin.me/@cryptodev7285

