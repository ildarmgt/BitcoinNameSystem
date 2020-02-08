import sanitize from './../../../src/helpers/sanitize'

describe('string sanitizer', () => {

  // each element is [input string, conditions, output string]
  const cases = [
    [
      ' 12lk3j4 56k  789lp. \n1-0  ',   // input
      'numbers',                        // conditions
      '12345678910'                     // output string
    ], [
      ' 12lk3j4 56k  789lp. \n1-0  ',
      ['numbers'],
      '12345678910'
    ], [
      '',
      ['decimal_point', 'numbers'],
      '0'
    ], [
      '0.0150.',
      ['decimal_point', 'numbers'],
      '0.0150'
    ], [
      '6.0v',
      ['decimal_point', 'numbers'],
      '6.0'
    ], [
      '000.0 1b50. ',
      ['decimal_point', 'numbers', 'no_leading_zeros'],
      '0.0150'
    ], [
      ' http:/ /abcdep qrstuvwxyz-=+123456`7890A\nBCDEFOP<>^`{|}QRSXYZ~  /#?&!()  \t 8',
      'url',
      'http://abcdepqrstuvwxyz-=+1234567890ABCDEFOPQRSXYZ~/#?&!()8'
    ], [
      ' dog\n 12cat bike apple   -=+120A\nBCDwaElletFOP<>^`{|}QRSXYZ~  /#?&!()  \t 8   ',
      'lowcaps spaces single_space_width'.split(' '),
      ' dog cat bike apple wallet '
    ], [
      ' xm\nr\t!2   ',
      'oneline',
      'xmr!2'
    ]
  ]

  test.each(cases)(
    "given %p and conditions %p returns %p",
    (inputString, conditions, outputString) => {
      const result = sanitize(inputString, conditions)
      expect(result).toEqual(outputString)
    }
  )

})

//  'lowcaps spaces single_space_width'.split(' ')