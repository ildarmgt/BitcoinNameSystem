# Dev Blog

### 2020-03-05

Have really struggled with some minor details with the site that were making extremely distracting. Mobile browsing was not wokring at all due to unique way they handle address and other bars covering up access. Entire layout had to be redone for almost every page but gave me a chance to simplify it. Another was the Bitcoin logo. I don't know enough (anything) about licensing to be sure I'm using online ones correctly so I made my own but it kept wiggling. I do not like the terrible support for SVGs so I shied away from those but I wanted vectorized and not pixelated. I also needed to use a free font because the Bitcoin symbol code isn't available in most fonts and is rendered by totally random font on different computers unless I provide it. I went with Ubuntu font in the end for more modern sans serif appearence. Its slight roundness makes it almost feel like a sphere rather than a coin which is appropriate for "a whole new world" type of project its invention created. I made one using multiple divs with a B +bars + mask but the random pixel snapping approximations made individual parts move around when downscaled. Since I was hoping to incorporate Bitcoin logo as the wallet access symbol I can re-use on Bitcoin-centric project, I really wanted to figure it out so I delved into CSS details. A bit of a detour but I learned long ago the importance of a non-distracting presentation, and a recognizable symbol can't be warped. I discovered [single div art](https://hacks.mozilla.org/2014/09/single-div-drawings-with-css/) techniques using standard CSS3 and created the logo with basically 2 divs - background, and then B with 4 box shadows for prongs. https://codesandbox.io/s/winter-wood-0wnyj is the result. The other divs were just logic separation not to overwrite important internal properties and clip overflow if any. Apparently CSS has 2 major forms of coordinate calculations - one that rounds to pixels (top, left, so on) and more accurate subpixel accuracy ones (transforms, scale). Also the latter are much faster to calculate by triggering less layout movements. Switching to latter helped significantly and is going to significantly affect how I will build pages from now on. I had a random idea of pure CSS animations made in browser instead of code to possibly introduce bit more art for simple things like loaders later so I made a tool in few hours to see if the idea had merit: https://codepen.io/ildarmgt/pen/XWbepQR - customizable drawing area to output css needed to animate a single div without writing any code. The output it creates looks like this: https://codepen.io/ildarmgt/pen/NWqadEK - animating and moving 1000s of shadows is surprisingly fast, even on mobile probably because it uses 1 div. Maybe it was a bit of a distraction from my main goal but I wanted a tool that didn't exist and now I have it and it was fun to make. The CSS could probably be minified by converting to specific units instead of viewport calculations - by far the least efficient part.

<p align="center">
  <img src="https://i.imgur.com/HDKHeJi.jpg" width="200" height="200"  />
</p>

React has so many strange issues that also came up including simple things like forwarding. This is my first react app after a few tutorials (last app was my first vue app) because why not learn something new. One of the most frustrating rules was inability to automatically forward to another page while rendering without an error without using a special obscure rendering component in jsx/html form. The error actually caused it to fire off continous API events by reloading same page with alias still still in URL when using shorter url names like onbtc.me/?satoshi and - exact problem I built promise based task queue to avoid. I simplified the task queue to more cautious side, and used the obscure jsx element I wanted to avoid. I'm forced to use hash router for offline file system mode to be possible (lol react) but it has a lot less documentation.

This writing & todo list is helpful to organize my plans. I also been struggling to figure out where to put interface for stealth addresses so it's not hidden into uselessness by something as silly as bad UI. I think I'm going to keep going with the idea of a separate web wallet, sandboxed and for all platforms easily implemented in any browser or react native + electron desktop apps, so on. I will have to make a request to wallet for filling in stealth address xpub on page 4 where forwards to embed are filled out. But I shouldn't put entire stealth address interface into totally independent BNS broadcast page set. The wallet interface makes most sense as just one of multiple options it offers. When app needs something, it should fire off a request to wallet. If wallet is missing it, it should ask the user. When it has necessary info it should respond. I'll use basic js events with custom data for this not to mess with more exotic methods. Similar can be done for addresses and keys. I should replace current design requiring private key immidiately and instead only ask for address even from wallet. That can be provided via keys or address without exposing keys until necessary. Once all necessary data is loaded into wallet, it can ideally be transfered or connection turned off to use keys. Every action wallet takes should have its own neutral visual to OK/DENY it. It should allow completely custom bitcoin smart contracts.

It will have to also be in binary form to fit into 78 of 80 bytes - 2 other bytes can be used for separator and type of network symbol. I was considering s, S, \$, ?. I also need a way to signal that data is binary encoded. The idea was for special encoding to be specified after network name and !. For very unique example: `ɱ!58m someaddress` to identify network is ɱ (U+0271) - 2 bytes utf8 unique representation. `!` then symbols more non-address data which I want to make by default encoding (`!` as first character means user commands). Then a reference file will be pinged for encoding type 58m. Why this example is that xmr doesn't use regular base58 encoder but its own. People could add their own encoders/decoders as they please. Space separator (1byte) symbols tthe rest is address. Problem with xpub is 78 bytes leaves almost no room for that standard so have to make exceptions w/o splitting into 2 tx. The form of `? 78bytescode` could be used for stealth addresses. Another standard can just use another 1 byte code (up to 0x7F are 1 byte [basic latin in utf8](https://unicode-table.com/en/blocks/basic-latin/)) and idelly not overlap. As secondary check I should include a verification function for xpubs to return if it passes the test after decoding or shoud list it as arbitrary data. Once forwards interpreter sees `? *` (after decryption), it checks `?` is associated with my stealth addresses, but to be sure checks if it's valid xpub. If it passes test, it presents it as stealth address code to show to senders, that emits an event for wallet. Wallet opens up gui on click and starts deriving possible addresses the sender can send to, possibly with custom source of randomness. The wallet would let them send a notification and transact in same transaction OR just notify to make tx sent from regular wallet discoverable for recepient. I don't know of any common wallet allowing requests for tx with custom OP_RETURN so requiring me to implement basics first instead of my application.

I tried searching for a wallet that does it many times but could not find. I really don't like writing wallets for general use as it's a lot of responsibility & either already exists or too niche. I guess for a demo with clear warnings it's not reviewed it's ok when necessary. Generally it's time consuming and a tool I wish I already had. Lack of such tool is probably why so many thought for so long Bitcoin doesn't have smart contracts. There is BIP for payment requests but from what I can tell it doesn't give enough detail for custom things like opreturns or scripts (e.g. bip 70 and bip 79). Bitcoin has always been more tech oriented than UI which is starting to change due to more interest in the space.

Samourai is one of the group of developers I respect the most in this space that has been putting out some of best privacy tech on Bitcoin with useful UI. We've always had ability to do it but without users being able to use, understand it, and not require knowing everythign about command line and arbitrary packages it actually hurts the # of users, the anonimity set, and thus the goal of privacy which in the end is the goal of staying safe from randoms and fungibility of the currency for all. I really want to get them to comment on my implementation asap and adopt something similar like bns or even bns itself. I build tools I want to use, as do they. Paynyms were a great attempt. In my opinion, bip47 has issues with separate notifications requiring extremely careful use of your own output and is ruined by receivers derivable address if public. Second is the extremely unweildy payment codes (100+ chars). Both are solved with BNS and this modification on stealth addresses (that I couldn't find alternative to, I tried). Anonimous stealth addresses + samourai level mixing tech + submarine swaps (atomic swaps with LN) built into the wallet are extremely great. I also hope I can use BNS to share the persistent addresses on LN coming out soon too - all with a single link.

### 2020-03-01

Where to place wallet has been difficult challenge without having resusable universal bitcoin wallet that can get input from browsers. I dislike the idea of browser plugins due to difficulty checking them, possible ninja updates or takeovers, access to all pages people browse, inability to install your own (easily). Not sure it's good idea to use weird desktop wallets that could expose the system. I like sandboxing of browsers to keep system (phone/pc) safe from others code, some built in CORS protections, and universal readability on macs, pc, linux, phone - what java originally intended to be.

Independent js wallet (currently implemented as react component but can be remade with basics for easier review with minimal dependencies) is what I have been working on that can be used anywhere and get data from events. Great for developing and implementing different ideas. Downside as just imported js is it's not so great for users: if different website claims to use it, their version might be modified. Ideally do not have to always be reviewing or trusting wallet implementations in addition to contract implementations on different websites. I'll likely just use it directly as is for now built into the page.

For use with my other app and elsewhere I had to consider making it reusable for users as well. Making a custom wallet GUI/logic for inheritance app, bns, and now bns stealth addresses in addition to contract GUI/logic is very time consuming. Stealth address use and search would need completely different design of transactions and logic and thus different forms, inputs, outputs.

One option was to use in browser wallet with cross tab cross origin communication or basic web sockets.

https://github.com/wingify/across-tabs

It could even be opened from copy on desktop and communicate with application, only between ones that choose to do. Then it could be closed. Then wallet version could be held constant and reused.

Second option is putting all tx data into qr image (up to 3kb possible) and scanning it with browser wallet on mobile that handles the signing (and maybe api and broadcasts) Apparently browsers already have access to camera via HTML5 so can process QR codes themselves without any servers. If using webapp on mobile would have to pass data to wallet webapp some other way. I thought this would be nice to use old offline phone as means to sign the transactions separate from hot app wallet. Problem I have is psbt implementation I use requires full hex of previous transacitons, which could put data necessary to transmit to cold phone over 3kb limits of qr codes, but I guess possible to do it more than once if necessary. With each tx often ~250 bytes, fewer inputs means just 1 qr code will still work usually. Either way could work as an option to sign using reusable separate device and webapp between different bitcoin scripts.

https://www.html5rocks.com/en/tutorials/getusermedia/intro/

https://www.sitepoint.com/create-qr-code-reader-mobile-website/

I'll worry about this later while trying to keep wallet design as generalized as possible.

Downsides of browsers make me want to recommend somewhere in app few ideas such as how to open guest or incongnito mode sessions without any extensions. Browsers also would have trouble doing anything more than an SPV node, which is already done elsewhere. The new setting of being able to run and link to your own full node to interface with app is another step for security. Once the wallet is done, I can alter the flow a bit so no keys are necessary until tx is ready to sign, so keys could be signed completely offline. I'll also look into spv browser implementation I really want to sync backwards to check header hashes to progressively older and more secure known hashes - should allow faster use of app without full node but with more security depending on how long the sync is allowed to run for.

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
