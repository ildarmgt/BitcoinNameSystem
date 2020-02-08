import { encrypt, decrypt } from './../../../src/helpers/bns/cryptography'


describe('Encrypting and decrypting', () => {

  describe('80 bytes string can be encrypted and decrypted', () => {

    const stringToEncrypt = 'btc 1A2zP1eP5QGefi7DMPTfTL6SLmv7DivfNa twitter 12345678910abcd https bitcoin.org'

    const typicalKey = 'satoshi.btctb1qy80760g49hses52egukdh89l63fgmcch3wdqsf1665084'

    const cipher = encrypt(stringToEncrypt, typicalKey)

    test('Cipher is Buffer', () => {
      expect(Buffer.isBuffer(cipher)).toEqual(true)
    })

    test('Cipher is 80 bytes', () => {
      expect(cipher.length).toEqual(80)
    })

    const decrypted = decrypt(cipher, typicalKey)

    test('Decrypted string equals to encrypted string', () => {
      expect(decrypted).toEqual(stringToEncrypt)
    })

  })

  describe('empty string can be encrypted and decrypted', () => {

    const stringToEncrypt = ''

    const typicalKey = 'satoshi.btctb1qy80760g49hses52egukdh89l63fgmcch3wdqsf1665084'

    const cipher = encrypt(stringToEncrypt, typicalKey)

    test('Cipher is Buffer', () => {
      expect(Buffer.isBuffer(cipher)).toEqual(true)
    })

    test('Cipher is 0 bytes', () => {
      expect(cipher.length).toEqual(0)
    })

    const decrypted = decrypt(cipher, typicalKey)

    test('Decrypted string equals to encrypted string', () => {
      expect(decrypted).toEqual(stringToEncrypt)
    })

  })

})

