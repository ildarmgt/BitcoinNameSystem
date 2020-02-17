
## Short term

- (PRIORITY 2) accurately allow creation of bidding tx with helpful information and risks shown

  - need to show refunds left to do
  - tell / warn user how many refunds left to do (next to bid amount)
  - need to add refunds to outputs
  - need to show unconfirmed burn amounts


- (PRIORITY 3) if notification is on input, shouldn't be necessary to include it on output! Conditions could check for either, and thus cut down in notification utxo use and smaller/cheaper tx  (modify)

- (PRIORITY 4) stealth addresses proof of concept to send, receive, UI



- settings page
- page navigation improved for hopping and checks

- `!a  <# of BTCs>` - Post price to sell (output @0), measured in floating point btc. Owner address (input @0). Similar to challenge period but instead of burning, tx are sent to owner. ~24 hours from time of first bid w/ more left on lease, cannot transfer ownership after first bid. Include notification (output @1) & optional public notification to '':'' address (@output 2). Must be no owner's ACS, use as inputs (inputs @1+). Does not change lease expiration - only burns can extend even if transfered.

- `!ba <last price in floating BTC>` Bid on auction. Must: 1. State price at point of bid via the !buy command in op_return (output @0). 2. Must consume past ACS inputs at that price height (includes the owners public notification at '':'' if used) (inputs @1+). 3. Refund previous valid bidders (outputs @4+). 4. Pay 1.5x last price requested except for original price (output @3). 5. Create notification (output @1). 6. Use desired ownership/refund adderss as first input (input @0). Winner is derived 24 hours after first bid by highest price that followed all the rules. Does not change lease expiration - only burns can extend even if transfered.


- when changing yoru own address, should require cleaning up your old utxo from new address. could use an array under user state to track old addresses that can be checked in utxo rule scan.

- multipage tx scan (setting up test cases on testnet)


- download/read backup file option (sjcl encrypted)

- originally use timestamp to approximate how long this owner has been in control. (only relevant if new owner)
  (doesn't require additional API call for current blockheight)
  - warn if still bidding period
  - warn if bns alias is available (new or owner expired)
  - full alias ownership history view option
  - days since new alias owner (warn if very new)
  - for alias's each key (network)
    - full history view option
    - days since update for each network/value shown (users can be warned if very new change)

- write out all rules in readme with extreme detail akin to pseudocode so can be reproduced in any code

- npm library

- npm library implemented with api/docker

- multi-tx addresses interpretations (breaking them into pages)

- more generic & user customizable interpretation logic

- encoding interpretations


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

  - bid challenges (kept generic so can be reused for non-burns)

  - should winner of bids at same height have to refund losing bids?
    - decided on NO - minimize required tx
    - refunds are a way to increase costs for challenges but also help those outbid
    - competing for ownership shouldn't be easy or cheap as that could cause greifing.
    - minimum multiplier over previous bid is another example of forcing increased costs per bid to avoid minor annoyances
    - not only is it safer to surpass minimum multiplier in bid amount significantly, it also gives much higher weight of winning bid on rare chance tx ends up in same block.

  - minimums and refunds: at some time during bidding period, there could be a mix of confirmed and unconfirmed tx bidding. most effective bids that accept the cost to win would be encouraged to significantly outbid everyone else. There are no obvious reasons to allow fighting over minor fractions for ownership and only makes the domains less appealing. However, if there is a demand for a specific domain that only has a lowball bid on it, a significant increase (like x10) should be worth it. Minimize pointless tx span and griefing. For most cases, 24 hours waiting period is only a formality as nobody will know that domain is bid on without extensive monitoring that only gets tougher as aliases get longer. 24 hours is shortest amount of time that gives everyone around the world chance to check the status during regular awake hours to allow oportunity to challenge but keep delay small if not. Even non-owners can be adding forwarding info to the domain in same tx or after the bids to save on fees. As burn amounts get significant, the reimbersement requirement should the losing parties significantly but it's always a risk and not a guarantee. Refunds could be held off until near the end to see if they are worth it.

- address reuse avoidance
  - owner could be updated via nonced script or hd wallet (would need xpub stored) or changing address
  - unlikely to help enough given the op_return output on all

- notification tx could also be nonced
  - would have to request significantly more address data
  - spending it reveals script as anyone can spend
  - could add random noise to tx amount to avoid round numbers


- maybe better approach is to assume domains are not private once domain is known
- store information there that allows some privacy (ln, stealth addresses)
- in browser submarine swaps could load LN coins

api submarine swaps for an option: https://docs.boltz.exchange/en/latest/lifecycle/

can connect to LN? spending-only channel creation and sending is safe (?) from loss since there's no older channel state to broadcast where user spends more than what's already spent.

- how cheap are k=1/2 signatures to use vs script acs.
  choosing k=1/2 allows everyone to compute the private key but that's the point of acs.
  R = k*G
  r = x coordinate of R

- minimum output amounts for notification might need to include considerations of the fee necessary to spend them rather
  to keep values practical.

  test:
  - create 2 dummy tx with and without the notification as an input
  - difference in vBytes between them is the minNoticationSizeBasis
  - at any fee rate (sat/vBytes) the minNotificationSpendingCost = minNoticationSizeBasis * feeRate
  - any amounts larger than minNotificationSpendingCost in output mean they incentivize spending if network feeRate is same as before
  - any amounts smaller than minNotificationSpendingCost should not be allowed


  when checking tx:
  - calculate tx fee used (fees that are included in blockchain means they were high enough to use practically)
  - get/calculate vBytes of the tx
  - back calculate feeRate (sat/vByte) used
  - apply that fee Rate on dummy tx with and without the notification as an input
  - the difference is the minimum amount of value when spending from that notification costs as much as it provides
  - amount in notification must be greater or equal to difference in cost of the above test to make them free to spend.

  when making tx with notification as output:
  - use the test's minNoticationSizeBasis and multiply by feeRate chosen by user to get value to put into them

  problem: if original tx is not accepted and has to be pushed via CPFP, it could pay significantly smaller original fee and thus amount in notification. CPFP could be used to create smaller notification outputs but CPFP rules require paying new fee rate for both parent and child, which means sender will still pay same or higher fees. if CPFP is done via notification output spending, it solves the problem it created, but could also be done with another output leaving bad utxo behind - saves purely on # of sats not placed into notification utxo. most rules require cleaning up your own utxo so not too dangerous.
  CPFP effective fee rate calculations miners do: minerFeeRate = (sum of fees from all tx)/(sum of all sizes of all tx (in vBytes))

- dust limits are currently calculated on mainnet at 3 sat/byte which is easier for witness tx but still very low if fees are 30 sat/vByte.
