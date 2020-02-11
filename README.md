# Bitcoin Name System (BNS) (NOT DONE)

On-chain DNS where easy to read domain name (i.e. alias) can be looked up or created to forward to very long alphanumeric Bitcoin addresses or other network's types of addreses (e.g. ipfs, https, twitter) on the most secure public network ever created.

Used: React (Hooks), TypeScript, Node.js, JavaScript, CSS, HTML.

![pic](https://i.imgur.com/37uMiO6.png)

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

  Located here: [Terminology and definitions](Definitions.md)

  Example: `satoshi.btc` domain name alias could have multiple entries for forwarding information including one where for `twitter` network `halfin` is provided for forwarding address to make it easy to find his twitter account, one where for `https` network `bitcoin.org` is provided as forwarding address to make it easy to find his home page on the world wide web, and `btc!p2wsh` network has a provided forwarding bitcoin address of `bc1q_FAKE_ADDRESS_e2`.

## Payments

This design cannot be entirely free to prevent domains being captured en masse, especially over a challenged domain. Having non zero burn costs, typical fee market costs, limited ownership duration of ~ 1 year, challenge period for ownership ~ 24 hours, & extensions costs equal to winning bid costs should minimize multiple domain squatting, even for miners. Nothing is required to go to me in any way, my costs are same as everyone elses. Miners could try to put their transaction

## What works

(using testnet and short duration testing mode parameters for now)

* Transactions are created and broadcast within the UI based on action chosen and requirements. Tx is summarized on same page as broadcast.

* User action: Changing your own ownership address (keeping forwards, change is sent to new address by default)

* User action: Giving up ownership to another address (no forwarding information kept)

* User action: Claiming unclaimed or expired domain

* User action: Extending ownership of your domain

* User action: Changing forwarding information

* Enforced rules that require clean up of your own notification UTXO

* Searching for domain ownership and forwarding information

* Encryption and decryption of embedded information (AES-256-CTR)

* Creating or importing wallet from bip39 backup

* Async blockstream.info API calls

* API requested data for wallet tx history & utxo

* API requested data for notification address tx history, (derived utxo), and raw tx for utxo to feed psbt tx maker

* API requested data for fee suggestions and user choice menu

* Wallet total unspent balance

* Easy to understand description on about page

## Donations

BTC LN: https://tippin.me/@cryptodev7285

