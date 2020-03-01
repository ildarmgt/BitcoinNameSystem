# Dev Blog

### 2020-02-25

Thinking a lot on what is acceptable to do in my implementation. For example, I think using any design that gives me an advantage would put into question both the technical design and my ethics. This is why there will not be any rules about paying me. But if the design allows some funding for improving the bitcoin ecosystem without any security compromise I'm aware of. My desire to take advantage of it would also give others reason to make incompatible implementation that's neutral or where they are the recepient. The biggest danger is too many confusing standards.

For this reason, this implementation's consensus rules should stay neutral.

The funding sources could come from implementation in various UI defaults that, for example, could by default set fixed % tip sent to their account that users can opt out of. This design is often used in mining software. Source code is basically expected to be available when dealing with designs built entirely around not having to trust any one group so users can edit out the tips if the option is not provided in the UI. Of course the logic behind it should probably make sure that the costs of adding a tip are very minor to end user overall and it's clearly visible.

The notifications have to have some funds in them to work. It would've been easy to create notification address designed in a way where only I can spend them. But, due to costs of spending each UTXO, the amounts wasted would have to be large to make it worthwhile. Those costs not affecting me would give me an advantage and give others less reason to use a selfish BNS design. Also, for me to be aware of those addresses, I would have to use less specialized addresses or requiring making BNS use more obvious leading to more privacy leaks. This is why I kept notification minimum very close to dust levels. In future I plan to make notifications count both as inputs and outputs so some minimum amount makes consuming them less costly. Requiring consuming your own notification outputs is another way to balance out the fact it's cheaper to create UTXO than spend it in most cases. I already downgraded sha256 to hash160 for shorter script to spend but didn't want them too short to avoid uncertainty of collisions.

Stealth address implementation is latest of such choices of choosing a default notification address. Here the goal is a bit different. Notification address should not be based on anything connected to intended recepient. So, in theory, I could collect it or could use almost any publically used address for it. If they spend the output, great, more complexity in tracing. I can't force any rules of minimums nor to consume all notification utxo people spend since stealth address doesn't depend on BNS rules, just maybe default UI settings that could be changed. The trade off with stealth notification choices is as such:

- If recepient provides a unique public static notification address, anyone sending to notification address would signal they are intending to send to recepient and would have to pay in separate transaction to keep at least amount paid private (expensive). On other hand, by giving up privacy only extremely relevant transactions will need to be scanned.

- Opposite scenario: many old stealth address implementations often relied on simple OP_RETURN where recepient would have to check every single OP_RETURN (has no address) to look for one intended for them which is a LOT of transactions to download and parse. On other hand, the link between sender and recepient would be broken with every OP_RETURN serving as the anonymity set for sender and recepient anonimity set is all known public stealth address users. Generic notification address = can do stealth tx within same tx.

- An often used address could be used as notification address where OP_RETURN exists within same tx outputs. This cuts down from having to parse every transaction to only ones included there. But OP_RETURN use does leak structure info anyway of intended use for stealth address notifications unless address does a lot of similar looking transactions, reducing anonimity set. Generic notification address = can do stealth tx within same tx.

- My implementation is to use a generic address that's used for stealth address notifications in general by everyone, used by every stealth address sender, completely independent from recepients, other than those identified by sharing their static stealth address payment codes. The encryption of bns data helps prevent decrypting of static public payment code without knowing domain to help keep people out of recepient set if even a little. Every sender then helps hide other senders, adds to amount of data to parse, but without additional useless random data of a popular address that might not be improving privacy. The notification address could also be included in other usecases with similar looking tx to help hide information further.

Stealth notification address could be set to an address someone controls, but since there's no reason to pay more than just above dust, it's unlikely to be easily spendable. Anyone can spend output can be created with shortest script and scriptsig to keep its size when used in tx as close as possible to output size to incentivize utxo cleanup. (p2wsh scriptPubKey (outs) is 34 bytes while bip16 p2wsh is 23 bytes. Native witness program requires empty scriptsig (ins). Both require txid of 32 bytes + 4 bytes for vout + 4 bytes for sequence for inputs or 8 byte for value and those pubkey sizes minimum for outputs, excluding a few length bytes) I'll look for something that's cheap to spend, not just to output, with dust limit making up some of the difference, and also unique for this usecase, so people can literally choose to spend others notifications for inputs, cleaning up the set. If users are already paying for output, in theory, an optional tip address could be used instead that doesn't require wasting on additional output costs. If user opts out of tip, output can be reverted back to anyone can spend. Recepients would simply have to scan 2 addresses instead of 1 without any forced downsides. Originally I was planning to use some bns standard notification address but hash160 20 bytes adds input script length that could be avoided. So a 2nd publicly aimed notification standard will need to be tested and implemented for times when you do want to notify everyone, not just for a certain domain.

Considerations that aren't purely technical are not particularly important and low priority but would be nice & practical to have for at least a little sustainable development. I guess the practical considerations are similar to having hard to use tools that make even good technicals irrelevant.

### 2020-02-24

Basic implementation done as a series of tests complete.

![pic](https://i.imgur.com/wnZ52zJ.png)

Works so far.

Interesting derivation of reusable node with public key takes ~5 sec but derivation with private less than half the time.
Then individual sequence of children nodes are then easily calculated.

`src/utils/bns/stealthaddress.test.js`

### 2020-02-23

Was difficult to find ECEIS implementation to use for OP_RETURN. The bytes are not cheap and needed enough flexibility to use compressed keys, use the same keys in matching format as bitcoin library, and remove HMAC to save space. OP_RETURN only has 80 bytes to use for standard transactions.

`https://github.com/bin-y/standard-ecies` & `https://www.npmjs.com/package/standard-ecies`

This library was the closest I found had almost no dependencies but was a bit difficult to customize and bit space consuming.

HMAC check didn't appear necessary or worth 16+ bytes since the message is already signed and extremely difficult to modify by anyone else.

However, I did want a small checksum to quickly know if decryption was successful when scanning many tx with potential secrets matching users public key. So I added my own checksum using constant 4 bytes of sha256 I added to end of cleartext and removed when decrypting.

For the internal encryption I went ahead with CTR mode again to avoid large minimum blocks. The nonce can always be unique simply by combining sender, recepient, and times a secret was encrypted to get a unique but deterministic nonce every time (my goal only needs one notification ever).

With compressed key and checksum I only need 33+4=37 bytes overhead, leaving 43 bytes to encrypt secret messages for any public key.

```
src/helpers/bns/ecies.tsx
src/utils/bns/ecies.test.js
```

This was a necessary 1st step to implement stealth addresses within BNS.

With 43 bytes to use after overhead, it will be trivial to get even 256 bits of entropy to hide stealth addresses.

I didn't want to write bip47 implementation myself from scratch and instead rely on tried and tested cryptographic primitives that have been well reviewed.

Now I should be able to target xpub posted under a domain, generate a transaction that both notifies the target via their public key and sends credits to an address they control and can easily find based on random number we picked.

Notification address, unlike bip47, doesn't have to be theirs as that could connect to their public xpub. Also the bip47 spec suggests using only 0-2147483647 or <4 bytes of entropy but at very little additional data that could be increased outside (current) brute force range. That's particularly importnat if the payment code is public information.

Instead can use a generic notification address (same one used by everyone) and target simply scans all embedded data notifying there for successful decryption (check sum), which would reveal the secret path where their coins are.

With up to 256 bits of entropy, it's infeasible for anyone else to parse every path.

With up to 256 bits of entropy to generate cipher, it's infeasible for anyone else to create rainbow tables.

The notification address has no connection to any specific person or any public key.

The cipher in notification can only be decrypted with the private key of the recepient.

This allows notifying and sending in same transaction so it's cheaper.

Recepient doesn't have to do anything other than post xpub (using throwaway hardened path in case private key is compromised) and scan a very small number of addresses when they want to access funds - non-interactive stealth address after xpub is posted.

This means (any number of people) 1337 people can send to awesome.btc user who posted xpub for stealth address, with transactions all going to unique addresses, each sender only aware of their own transactions, and requiring no interaction with awesome.btc user. When awesome.btc user decides to check, he simply scans a single generic notification address, finds every secret he can decrypt, derive keys from each secret, and be able to spend all those funds!

(Maybe I'm missing something)

Only downside I can see is by using the generic notification address, the sender might be making it obvious they are probably sending to someone privately even if unclear who. But they only have to do it once. After the first notification, with or without sending within same tx, the path can be just increased by 1 each time and thus requires no further notifications.

Of course, this is a minor privacy improvement and doesn't remove the need to remember about the individual utxo, but it's also very cool I can give something like awesome.btc personalized name, go afk, and people sending to me do not see each other nor my other transaction history.

I'm excited to finish writing this.
