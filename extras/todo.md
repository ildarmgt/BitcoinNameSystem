## Short term

- loading animation for search now that it's longer for multipage calls

- bns should be separated into a separate npm library, was already segregated to src/helpers/bns folder with that in mind, but basics are done already

- stealth addresses proof of concept to send, receive, UI

- independent single task queue for (each) api. visually might be easiest to handle them as a component, pass api functions as props, and even show history of all api calls and results for clarity or progress of calls. Component can be placed high up on tree to limit redraws and with persistent state. Editing api settings would could just render another component with different props killing previous. Combined with wallet component, these could then even be deployed as stand alone app, browser plugin, or reused in another app.

- all different transaction types are putting too much complexity into transaction building function. I should create a wallet component that can be reused into any project to respond to queries. Source for query should be customizable and can come from state or even url. Wallet should handle displaying all data in full generic detail and give user option to review, accept, or deny broadcasts. This should allow separating logic for putting rules to do something vs putting together the bytes of transactions properly via 1 or more methods. Ideally I shouldn't have to scan for full tx hex's for all inputs until wallet is ready to build where it can queue api for only necessary tx hex's.

- if notification is on input, shouldn't be necessary to include it on output! Conditions could check for either, and thus cut down in notification utxo use and smaller/cheaper tx (modify)

- settings page
- page navigation improved for hopping and checks
- detect and fix dust outputs in tx maker
- standardize lower case on addresses or hex strings used for hash?
- say when no available actions exist on page 4 instead of NOTHING
- set ubuntu font as fallback for special unicode characters since other one almost surely doesn't have it! (check U+0271 and aprox equal symbols) - [this method for utf ranges](https://stackoverflow.com/a/11395766/12695295) [and/or this method](https://24ways.org/2011/creating-custom-font-stacks-with-unicode-range/)

- `!a <# of BTCs>` - Post price to sell (output @0), measured in floating point btc. Owner address (input @0). Similar to challenge period but instead of burning, tx are sent to owner. ~24 hours from time of first bid w/ more left on lease, cannot transfer ownership after first bid. Include notification (output @1) & optional public notification to '':'' address (@output 2). Must be no owner's ACS, use as inputs (inputs @1+). Does not change lease expiration - only burns can extend even if transfered.

- `!ba <last price in floating BTC>` Bid on auction. Must: 1. State price at point of bid via the !buy command in op_return (output @0). 2. Must consume past ACS inputs at that price height (includes the owners public notification at '':'' if used) (inputs @1+). 3. Refund previous valid bidders (outputs @4+). 4. Pay 1.5x last price requested except for original price (output @3). 5. Create notification (output @1). 6. Use desired ownership/refund adderss as first input (input @0). Winner is derived 24 hours after first bid by highest price that followed all the rules. Does not change lease expiration - only burns can extend even if transfered.

- scroll bar too high on search results

- when changing yoru own address, should require cleaning up your old utxo from new address. could use an array under user state to track old addresses that can be checked in utxo rule scan.

- escape domain names for standard by default to prevent collisions with unescaped names and other url params, might prevent others from rendering it directly as well. decoding back to raw string can be easily done in done but riskier as default.
- no html drawn directly or 3rd party provided JSON files.

- multipage tx scan (setting up test cases on testnet)

- forward option to open url (if possible) or copy content to clipboard as side icons allow on links

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

- encoding interpretations

- allow to scan unconfirmed bidding information
  - need to show unconfirmed burn amounts

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

* BNS as a standard network choice to forward to another BNS alias

  - (no bns change needed, only in presentation of data have to do 2nd request)

* Remove address re-use. This is not easy since everyone has to keep track of owner address & ignore tx not from owner.

- option 2: - transfer ownership every tx to new owner address with a flag signifying same owner?

- private tx (that is not xmr or bip47)

  0. target shares xpub (like via domain)
  1. use a generic notification address on one output or input no matter who sender/target is
  1. encrypt used address secret path using targets public key at known path + validation that decryption was successful (2^31 values per derivation step max, so maybe 24bits () 10 times)
  1. sender sends to the address derived from the xpub and path
  1. target can scan notifications for embed they can decrypt with private key up to x height.
  1. they can apply the clear text to derive the wallet path with received funds

  - Attackers can know xpub so know pub key
  - attacker can't decrypt without private key
  - attacker can try to encrypt every possible secret path, but not probable with long enough random path of 240 bits
  - anon set limited to notification address or users have to scan too many tx
  - notification address used could be combined with more general
  - attacker could poison the tx by sending to a targets address and then following outputs. this could be avoided by immidiately doing submarine swap from each utxo to your LN node (https://submarineswaps.org/) or used in various coinjoin-type scenarios.

  and can't decrypt every notified text, but can encrypt with public key until match found. as well until finding result of a path

  - bid challenges (kept generic so can be reused for non-burns)

  - should winner of bids at same height have to refund losing bids?

    - decided on NO - minimize required tx
    - refunds are a way to increase costs for challenges but also help those outbid
    - competing for ownership shouldn't be easy or cheap as that could cause greifing.
    - minimum multiplier over previous bid is another example of forcing increased costs per bid to avoid minor annoyances
    - not only is it safer to surpass minimum multiplier in bid amount significantly, it also gives much higher weight of winning bid on rare chance tx ends up in same block.

  - minimums and refunds: at some time during bidding period, there could be a mix of confirmed and unconfirmed tx bidding. most effective bids that accept the cost to win would be encouraged to significantly outbid everyone else. There are no obvious reasons to allow fighting over minor fractions for ownership and only makes the domains less appealing. However, if there is a demand for a specific domain that only has a lowball bid on it, a significant increase (like x10) should be worth it. Minimize pointless tx span and griefing. For most cases, 24 hours waiting period is only a formality as nobody will know that domain is bid on without extensive monitoring that only gets tougher as aliases get longer. 24 hours is shortest amount of time that gives everyone around the world chance to check the status during regular awake hours to allow oportunity to challenge but keep delay small if not. Even non-owners can be adding forwarding info to the domain in same tx or after the bids to save on fees. As burn amounts get significant, the reimbersement requirement should the losing parties significantly but it's always a risk and not a guarantee. Refunds could be held off until near the end to see if they are worth it.

- address reuse avoidance
  - owner could be updated via nonced script if controlled from p2wsh but key pair for signature within script would stay same
  - owner could be deterministically updated via xpub but xpub sharing has similar risks to reuse
  - unlikely to help privacy enough given the op_return outputs and notification address on all
  - gets complicated if old address is ever reused for control, but could be abstracted under parent address
  - allows this now by changing address each tx via commands (page 4)
    - space consuming, can give decoded into bytes option
    - https://github.com/sipa/bech32/tree/master/ref/javascript
      ideally control address is simply used very rarely for only this purpose

* notification tx could also be nonced
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
  R = k\*G
  r = x coordinate of R

- minimum output amounts for notification might need to include considerations of the fee necessary to spend them rather
  to keep values practical.

  test:

  - create 2 dummy tx with and without the notification as an input
  - difference in vBytes between them is the minNoticationSizeBasis
  - at any fee rate (sat/vBytes) the minNotificationSpendingCost = minNoticationSizeBasis \* feeRate
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

Rejected ideas:

No privacy advantage, cold/hot key from users personal address implementation would be separate from bns anyway. Handling various outputs unlocking at arbitrary times is just difficult for all.

    option 1: switch from p2wpkh address to p2wsh address with hot and cold keys and script of type
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

alternative:

1. Add command to add cold address (no cold key necessary)
2. Doing #1 activates a delay on changes by hot key
3. Cold keys can remove hot key access that cancel all pending actions, not vise versa
4. Cold keys can remove themselves, canceling delay.

By doing delay purely with BNS state derivation, it's much less complex. Multi-address ownership structure needs to be explored. People can already use a multisig address as control address w/ their own UI so alternative is simple and opt-in.

---

Can I use this to show user any communication attempts on the page? https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent

onbtc.me/@satoshi for another name design?

what about automatic short url forwarding?

while staying offline file system friendly, possible to use subdomains? url.onbtc.me?satoshi

automatic forwarding to linked website:

onbtc.me?satoshi.url

onbtc.me?satoshi?url

or maybe since exclamations are reserved, those are better? question marks look dumb as a phrase. ! more exciting. = decent.
but ! is not uri encoded so might collide

since uri encoded, choice of escaped symbols maybe best: ;,/?:@&=+\$ which cannot collide with standard then

why not this?

onbtc.me/=alice

"on bitcoin I am alice" is easily readable, not a question, statement.

and for subdomains, add an @ similar to email with minor subdomain first:

onbtc.me/=url@alice - decent but not as readable

onbtc.me/=alice/url - seems more inline with url formats, minor things later, alice is the "me", url is property of alice.

"on bitcoin I am alice with this link for URL"
