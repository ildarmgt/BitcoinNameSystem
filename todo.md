
Short term

- add commands and interface

  - interface has a selection of all known commands to pick from

  - `!el ` - Extend lease. Burn winning amount again for another ~year. Must be no owner's ACS, use as inputs (inputs @1+). notify (output @1). Use owner address (input @0).

  - `!so <btcaddress>` - Send ownership to btcaddress. Can avoid reusing addresses by including new each time. Must be no owner's ACS, use as inputs (inputs @1+). owner address (input @0).

  - `!a  <# of BTCs>` - Post price to sell (output @0), measured in floating point btc. Owner address (input @0). Similar to challenge period but instead of burning, tx are sent to owner. ~24 hours from time of first bid w/ more left on lease, cannot transfer ownership after first bid. Include notification (output @1) & optional public notification to '':'' address (@output 2). Must be no owner's ACS, use as inputs (inputs @1+).

  - `!ba <last price in floating BTC>` Bid on auction. Must: 1. State price at point of bid via the !buy command in op_return (output @0). 2. Must consume past ACS inputs at that price height (includes the owners public notification at '':'' if used) (inputs @1+). 3. Refund previous valid bidders (outputs @4+). 4. Pay 1.5x last price requested except for original price (output @3). 5. Create notification (output @1). 6. Use desired ownership/refund adderss as first input (input @0). Winner is derived 24 hours after first bid by highest price that followed all the rules.


- multipage tx scan

- warn of bad entries on selection: e.g. blank network

- scan notification address for tx history (search does that) and current utxo (could derive from tx history but still need raw tx)

- sanitization of users custom text when read by other users to avoid unexpected injections

- Create process
  1. Create ownership address to create unique tx/wallet not easily done in other clients I know of. The keys for that address become controlling owners of that alias
  2. Create tx to own alias
    - put in aliases at same time w/ chars left
  The rest after this is done

- alias creation page (basic)
    - controlling address creation
    - controlling address broadcasts
    - backups: mneumonics or WIF or download file (sjcl encrypted)
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

- add ownership time rules & display time left
- add ownership extension rule & new display time left

- alias creation page (w/ bids)

- add challenge rules for ownership & creation
- add transfer rules for ownership & creation


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
