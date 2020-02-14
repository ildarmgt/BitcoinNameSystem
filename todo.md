
## Short term



- bid challenges (kept generic so can be reused for non-burns)

  - works: bid period start, end, and ownership assigned, require your own utxo clean up
  - left: minimum amounts

  - minimum amounts: starts with MIN_BURN constant. It's very hard to force minimum based on previous payments because those payments might not follow all the rules, payment might come in after other higher payments. What is possible is requiring all payments to be 2x of original burn, and then 2x of your own previous burn.

  - bid is placed on available domain
  - if only bid in 144 blocks, becomes owner
  - how to handle?
    - shouldn't use ownership time so that renewals don't trigger challenge period
    - bids are property of domain shared by all users so should use bid state within domain state directly.
    - first bid height should be logged after which point upgrade to owner happens through automatic actions like expirations.
    - bids only relevant if no owner
    - bids must be cleared after winner found so not confusing in future
    - each bid only counts if all bids before it are refunded at end of challenge period
    - since bids can take variable time to place, "before" is not easily determined until confirmation occurs. so anytime within challenge period, must allow to meet condition with follow up tx, and also scanning the pending tx
    - bids are only responsible for refunding the bids that confirmed at lower height than bid confirmed
    - while using up your own notification utxo is required for each user, ~~bids are also responsible for removing all utxo created during challenge period by anyone below its height.~~ (since soon allowing notifications as inputs & thus useful, can ignore this rule)
    - the ownership derivation takes place at height of challenge period end via only confirmed tx
    - each bid has to at least double burn amount of next runner up to win
    - (notification can be used for CPFP)
    - notifications are always used with notification utxo, but not necessarily with refunds. Only refunds with notifications count.

- (HIGH PRIORITY) if notification is on input, shouldn't be necessary to include it on output! Conditions could check for either, and thus cut down in notification utxo use and smaller/cheaper tx  (modify)

- multipage tx scan


- `!a  <# of BTCs>` - Post price to sell (output @0), measured in floating point btc. Owner address (input @0). Similar to challenge period but instead of burning, tx are sent to owner. ~24 hours from time of first bid w/ more left on lease, cannot transfer ownership after first bid. Include notification (output @1) & optional public notification to '':'' address (@output 2). Must be no owner's ACS, use as inputs (inputs @1+). Does not change lease expiration - only burns can extend even if transfered.

- `!ba <last price in floating BTC>` Bid on auction. Must: 1. State price at point of bid via the !buy command in op_return (output @0). 2. Must consume past ACS inputs at that price height (includes the owners public notification at '':'' if used) (inputs @1+). 3. Refund previous valid bidders (outputs @4+). 4. Pay 1.5x last price requested except for original price (output @3). 5. Create notification (output @1). 6. Use desired ownership/refund adderss as first input (input @0). Winner is derived 24 hours after first bid by highest price that followed all the rules. Does not change lease expiration - only burns can extend even if transfered.

- alias creation page
    - download/read generated file (sjcl encrypted)
    - bip47 standards

- originally use timestamp to approximate how long this owner has been in control. (only relevant if new owner)
  (doesn't require additional API call for current blockheight)
  - warn if still bidding period
  - warn if bns alias is available (new or owner expired)
  - full alias ownership history view option
  - days since new alias owner (warn if very new)
  - for alias's each key (network)
    - full history view option
    - days since update for each network/value shown (users can be warned if very new change)

- keep updating terminology in readme for consistency
- write out all rules in readme with extreme detail akin to pseudocode so can be reproduced in any code

- npm library

- npm library implemented with api for non-node usecases

---
Long term

- show full history of alias (maybe users want to use old values)

- full node backed server to provide bns look up for static pages or apps (REST or websockets)

- host look up service on ipfs (content hash should make it more reliable)

- host website on ipfs with link url updated via bns addresses
  `satoshi.btc` alias could have `ipfs` key point to value `/ipfs/firsthashhere123abc` website hosted on ipfs which has links via keys like key `ipfs/banana` forwards to value `/ipfs/bananahash123abc`. Then if banana page needs to be changed owner of `satoshi.btc` resubmits `ipfs/banana` key with new pages ipfs hash as value `ipfs/newbananahash456def` without having to change the home page under `ipfs` key.

- another api source, let users pick

- merkle proofs via api to the block hashes? blockhashes could be trivially pulled from every api source for comparison (doesn't check full history of blockheaders) - full spv in browser would require a lot of data

- api wrapper library for address matches, 1 of multiple api sources, multiple compared between each other?

- spv or neutrino implementation - request data from full nodes & do merkle tree proofs on data

- advantages of using Bitcoin - can see full history including time of changes as a warning

---
Tests

- automate predetermined scenarios and bids to make sure domain owner is always same. no API bc might get throttled.

---

Uncertain ideas

- messages, warnings to addresses

- who should initiate sales?
  - owner could post requested price in satoshi & duration in blocks
    if a tx paying to controller address with equal or more bitcoin appears (that notifies the alias address) ownership can be considered transfered. if less, nothing happens. they shouldn't send less.
  - buyer could put bitcoin into a contract that's accessible by owner's sig (can script match to address and not pub key?)
    if owner withdraws tx, domain counts as sold. would need to notify alias address both times

- how to store addresses/forwards longer than 80 bytes? (until multiple OP returns are ok)
  1. Could store information on ipfs and include ipfs link instead of xmr link
  2. Could reserve ! symbol for network and split messages e.g. random xmr address
    xmr!1/2 4B2YGz8aYgZ7R8AWDkkMqc72qgVaCFJhT6GW2T5gEhzyAuQ
    xmr!2/2 dHschMxdZgY9L6rHix466NR6viA3NFN2x8RcJjrxRE5VwTpm
  3. ! symbol can also signify encoding type if it saves space. For example,
    xmr!58m for network could mean xmr network, base 58 encoding xmr style (so bns doesn't interpret bytes as utf8, default, or even base58 bitcoin style)


- BNS as a standard network choice to forward to another BNS alias
  - (no bns change needed, only in presentation of data have to do 2nd request)

- Remove address re-use. This is not easy since everyone has to keep track of owner address & ignore tx not from owner.
  - option 1: switch from p2wpkh address to p2wsh address with hot and cold keys and script of type
  ```
  IF                                            // user selects hot key
    < 24 hours > CHECKSEQUENCEVERIFY DROP       // make sure 24 hours have passed since utxo was created
    < hot public key > CHECKSIGVERIFY           // compare hot public key to submitted signature
  ELSE                                          // user selects cold key
    < cold public key > CHECKSIGVERIFY          // compare cold public key to submitted signature
  ENDIF
  <nonce> DROP
  ```
  Start nonce at 0, every notification increase nonce by 1.
  If hot keys get stolen or lost, can use cold keys to transfer ownership to another address.
  Is this still necessary with RFC6979 for security? It won't give much privacy since everyone has to derive it.
  Could add logic to allow cold keys to undo hot keys actions for 24 hours so they can transfer ownership to address they do control.

  - option 2: - transfer ownership every tx to new owner address with a flag signifying same owner?

- private tx (that is not xmr or bip47)
  0. target shares xpub (like via domain)
  1. use a generic notification address on one output or input no matter who sender/target is
  2. encrypt used address secret path using targets public key at known path + validation that decryption was successful (2^31 values per derivation step max, so maybe 24bits () 10 times)
  3. sender sends to the address derived from the xpub and path
  4. target can scan notifications for embed they can decrypt with private key up to x height.
  5. they can apply the clear text to derive the wallet path with received funds

  - Attackers can know xpub so know pub key
  - attacker can't decrypt without private key
  - attacker can try to encrypt every possible secret path, but not probable with long enough random path of 240 bits
  - anon set limited to notification address or users have to scan too many tx
  - notification address used could be combined with more general
  - attacker could poison the tx by sending to a targets address and then following outputs. this could be avoided by immidiately doing submarine swap from each utxo to your LN node (https://submarineswaps.org/) or used in various coinjoin-type scenarios.

  and can't decrypt every notified text, but can encrypt with public key until match found.  as well until finding result of a path