# Bitcoin Name System (BNS)

On-chain DNS where easy to read domain name (i.e. alias) can be looked up or shared to forward to many very long alphanumeric Bitcoin addresses or other types of addreses (e.g. ipfs, https, twitter) on the most secure public network ever created.

Currently set to testnet by default.

|                           |                                                                                       |
| ------------------------: | ------------------------------------------------------------------------------------- |
|           Short demo url: | [onbtc.me](http://onbtc.me)                                                           |
|      Short url with name: | [onbtc.me?satoshi](http://onbtc.me?satoshi)                                           |
| Full final path for demo: | [ildarmgt.github.io/BitcoinNameSystem](https://ildarmgt.github.io/BitcoinNameSystem/) |

![pic](https://i.imgur.com/22AMxLh.png)

1 domain name on BNS can provide many forwarding addresses for any network.

BNS is currently still work in progress. I'm open to teaming up, seeking feedback.

## Tools used

React (Hooks), TypeScript, Node.js, JavaScript, CSS, HTML

bitcoinjs-lib, blockstream API (open source, editable url)

more listed in `package.json`

## To build project from scratch

```
git clone https://github.com/ildarmgt/BitcoinNameSystem.git bns
cd bns
npm ci # ci so fixed package versions are used to prevent unexpected changes
npm run build
```

The latest compiled release used can be found in `./docs/` folder

Website can eventually run offline by running index.html in `/docs/` folder (w/ rest of files in folder present) for putting together transactions on air-gapped computers.
(Tx creator not done & airgapped offline loading not done. Work in progress)

## To run project on localhost

```
npm run build
npm run serve
```

This makes it accessible locally at http://localhost:3000

## Testnet bitcoin faucets

free testnet coins, segwit compatible

- https://bitcoinfaucet.uo1.net/send.php
- https://testnet-faucet.mempool.co/

## Method used for BNS

![pic](https://i.imgur.com/Blx5Rfv.png)

Majority of rules will be implemented here (future npm library):

`src/helpers/bns/`

Not all rules in code are yet in final version as more complicated rules are introduced and lifecycle logic flow is in flux while searching for most effective and generalized ways to implement those rules.

Until I copy all rules here, basic premise is:

- Only have to request tx history for a single address per domain name.
  This should simplify the task for API & SPV/Neutrino clients

- Anyone can spend outputs used for that, so require cleanup of utxo for it to count.

- domain-name-to-forwarding look-up is one way - a hash of the domain name is used to determine a unique address via the a hash function - easy to do, hard to find what was hashed.

- ~1 year of blocks duration, ~24 hour of blocks challenge period with clean up & reimbersement required.

- Burns are kept small but non-0 (for miners) and at least double on each challenge.

Tons more stuff to list here and do in the app.

## Terminology and definitions

Located here: [Terminology and definitions](extras/Definitions.md)

## Payments

This design has neutral costs to prevent domains from being captured en masse, especially over a contested domain name. First layer of protection are burn costs where the coins are destroyed, which means they cannot be sent to oneself to get an unfair advantage. Bitcoin's fee market that secures the network creates significant barrier to sybil attack spam. Proof of key ownership and upkeep burns are required periodically through time-limited ownership duration of ~1 year. Every domain ownership bid can be challenged for first ~24 hours to give interested parties a chance to get domain they want. Only people watching specific domain names will be able to see which domains are bid on to prevent griefing. Ownership extensions costs are equal to winning bid costs, so for challenged domains upkeep is higher, equal to that of the winning bid every year. These measures combined should minimize domain squatting, even for miners. Nobody gets a significant advantage over others. For exampe, miners could try to put their transactions in without fees but would still cost them income from displacing other fee paying transactions. Additionally, they, nor anyone else, can get any discount on burning costs.

## What works

(using testnet and short duration testing mode parameters for now)

- Basic settings allows changing API source to your own node with [esplora](https://github.com/Blockstream/esplora/tree/esplora_v2.00) API.

- Bidding period for domains operational. Refunds on previous bids (by end height) and minimum increases (>= 2x) enforced for validity. Tie breaking at same height via pseudo-random deterministic function based on transaction's block hash gives nobody an advantage.

- Transactions are created and broadcast within the UI based on action chosen and requirements. Tx is summarized on same page as broadcast.

- User action: Changing your own ownership address (keeping forwards, change is sent to new address by default)

- User action: Giving up ownership to another address (no forwarding information kept)

- User action: Claiming unclaimed or expired domain

- User action: Extending ownership of your domain

- User action: Changing forwarding information

- Enforced rules that require clean up of your own notification UTXO

- Searching for domain ownership and forwarding information

- Encryption and decryption of embedded information (AES-256-CTR) + hashed aliases = one-way look up

- Creating or importing wallet from bip39 backup

- Async blockstream.info API calls

- API requested data for wallet tx history & utxo

- API requested data for notification address tx history, (derived utxo), and raw tx for utxo to feed psbt tx maker

- API requested data for fee suggestions and user choice menu

- Wallet total unspent balance

- Easy to understand description on about page

## What is the backend?

All data is on the Bitcoin blockchain. You choose how to fetch that data depending on convinience or security you want.

- rely on generic public bitcoin explorers via API interface (in demo)

- run your own full Bitcoin node with your own [open source API](https://github.com/Blockstream/esplora/tree/esplora_v2.00) interface matching what demo uses

- compare between many public API's (not done)

- neutrino or spv light clients with merkle tree proofs (planned, not done yet)

Decentralization works on the principle of not being forced to trust backends. BNS can be read with help of any Bitcoin full node, with early demo implementations relying on open source 3rd party API explorer interface, but can be replaced by personal full nodes to accomplish same thing. The goal is to provide multiple options ranging fast 3rd party API to implementations relying solely on your own Bitcoin full node to use BNS.

- Proof of concept with integrated front end is done via API calls to blockstream.info

- Explorer format used ([esplora](https://github.com/Blockstream/esplora/tree/esplora_v2.00)) could be ran privately by anyone following their instructions with open source code.

- (TODO) Options for custom API location + multi source comparison options

- (TODO) Options for merkle inclusion proofs for each tx

- (TODO) Proof of concept deployed as an npm library for use with node or browser clients

- (TODO) Proof of concept of single command docker deployment for full node or SPV implementations of private backends

## Security ideas

- Client hosted on github to give confidence in source code used

- Outgoing connections should be limited to requested API requests on button presses

- Nothing is saved outside your client without permission (UX suffers but security is priority)

- Air gapped signatures (TODO)

- No obvious method to track domains used or searched

- (TODO) Allow display of ownership history for each domain and forwarding information that includes warnings about any recent changes. BNS can provide unique transparency in changes

- Change address command allows minimizing address reuse without giving up ownership

## Privacy ideas

- No clear way to tell which domain user is using BNS

- Search only easy in one direction: from alias to forwarding information, especially with long aliases.

- Stealth address implementation

  - using slightly modified BIP47 principles for more entropy

  - single tx implementation

  - linkability:

    > "two transactions are unlinkable when an observer cannot prove that those two transactions were sent to the same user" - MRL-1

    no direct link (including notification) to a recepient, their domain, or their public xpub

  - traceability:

    > "transaction is considered untraceable if all possible senders of a transaction are equiprobable" - MRL-1

    traceability solution is beyond scope of this work and has to be solved via other methods:

    1. coinjoin
    2. wasabi
    3. lightning network (turbo) channels
    4. submarine swaps (atomic swaps between chain and lightning)
    5. atomic swaps to another chain
    6. probably more...

## Taking care of Bitcoin

Design was created with intention to not make Bitcoin worse.

- Contributes to fee market.
- Neutral costs, minimum asymetric advantages.
- Burns do not create UTXO (via OP_RETURN).
- Notification UTXO are forced to be consumed to not contribute to growing UTXO set.
- Notification UTXO are also "anyone can spend" to allow different users to spend and even provides some incentive to consume via minimum balance.
- Segwit and combining inputs/outputs is encouraged, multi-transaction methods are discouraged to minimize block space use.
- Give Bitcoin and other users the option of custom domains/aliases on Bitcoin without compromises in censorship resistance.

## Why not layer 2?

Domains and forwards are the one usecase that specifically does greatly benefit from persistent and easily accessible data. It might, however, be used for simplifying LN addresses or invoices, optionally even linking to ipfs if cheaper data needed.

## How is it different?

I am not aware of any other solutions without compromises that are pure Bitcoin based. It works through derivation entirely from always available public [replicated](http://luke.dashjr.org/programs/bitcoin/files/charts/services.html) Bitcoin blockchain data. There's no specialized indexing service needed (or possible) to scan every transaction with embedded messages to derive specific domain's state. Only a small domain-unique subset of transactions are relevant. BNS is using generic indexing by addresses already available in probably all standard Bitcoin node and explorer implementations.

## Names

The name was chosen to imply it's neutral system rather than service. I really don't know if tehre's a better one: Bitcoin Name Service, Bitcoin Name System, Bitcoin Name System Service, Bitcoin Domains, Bitcoin Domain Service, world's most expensive url shortener, world's most absurdly secure url shortener ^^, BitcoinNameService (BNS), Me on Bitcoin

## Donations

BTC LN: https://tippin.me/@cryptodev7285
