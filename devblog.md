
# Dev Blog

### 2020-02-24

Basic implementation done as a series of tests complete.

![pic](https://i.imgur.com/wnZ52zJ.png)

Works so far. Interesting derivation with public key takes ~5 sec but derivation with private less than half the time.

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