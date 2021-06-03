/**
 * Takes in a string of interest inputString
 * and Array of strings or string describing filter.
 * Returns the string of interst with only characters present in filters selected.
 */
export default function sanitize (inputString, stringOrArray) {
  inputString = String(inputString)

  // get choice input into same form of array of string(s) of choices
  let choices // :string | Array<string>
  if (Array.isArray(stringOrArray)) {
    choices = stringOrArray
  }
  if (typeof stringOrArray === 'string') {
    choices = [stringOrArray]
  }

  // add each choice to filter selection
  // (set object would be fastest but these are only a few letters)

  // string mask
  let filter = ''
  // array of functions
  const logicFilters = []

  choices.forEach(choice => {
    // short masks
    if (choice === 'numbers') {
      filter += '0123456789'
    }
    if (choice === 'fractions' || choice === 'number') {
      filter += '0123456789.'
    }
    if (choice === 'decimal_point') {
      filter += '.'
    }
    if (choice === 'hex') {
      filter += '0123456789abcdefABCDEF'
    }
    if (choice === 'lowcaps') {
      filter += 'abcdefghijklmnopqrstuvwxyz'
    }
    if (choice === 'highcaps') {
      filter += 'ABCDEFGHIJKLMNOPQRSTUVWYZ'
    }
    if (choice === 'spaces') {
      filter += ' '
    }

    // clean url and subdomain safe standard for bns
    if (choice === 'bns') {
      filter += '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~'
    }
    // longer masks
    if (choice === 'base58') {
      // https://en.wikipedia.org/wiki/Base58#cite_note-3
      filter += '12345689ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    }
    if (choice === 'basic') {
      filter += '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
    if (choice === 'oneline') {
      filter +=
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,./-_!`~[]{}|@#%^&()-=?$'
    }
    if (choice === 'url' || choice === 'string') {
      //  RFC 3986 (Section 2: Characters) 84 total
      filter += `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:/?#[]@!$&'()*+,;=-_.~`
    }

    // ========================================================
    // functions
    // adds anon function to array of functions

    if (choice === 'no_spaces') {
      logicFilters.push(str =>
        str
          .split('')
          .filter(letter => letter !== ' ')
          .join('')
      )
    }

    if (choice === 'single_space_width') {
      logicFilters.push(str =>
        // split by 2+ spaces and replace with single space
        str.split(/  */).join(' ')
      )
    }

    // keep only first decimal point
    if (choice === 'decimal_point') {
      logicFilters.push(str =>
        str
          // splits to array between .
          .split('.')
          // join first 2 elements with ., others with empty string
          // returns a string
          .reduce((resultingString, numbers, index) => {
            // real . goes b/w array's index 0 and 1, even if string had . first
            const digits = index === 0 && numbers === '' ? '0' : numbers
            return index === 1
              ? [resultingString, digits].join('.')
              : [resultingString, digits].join('')
          }, '')
      )
    }

    if (choice === 'no_leading_zeros') {
      logicFilters.push(str =>
        str
          // splits to array between .
          .split('.')
          .map((numbers, index) => {
            if (index === 0) {
              return (parseInt(numbers, 10) || 0).toString()
            } else {
              return numbers
            }
          })
          .join('.')
      )
    }

    // 'max_decimal_places:3'
    if (choice.startsWith('max_decimal_places')) {
      const maxDecimalPlaces = +choice.split(':')[1] || 8
      logicFilters.push(str => {
        const length = str.length
        const decimalIndex = str.indexOf('.')
        const digitsAfterDecimal = length - decimalIndex - 1
        // if there is no decimal or it's last character, no changes
        if (decimalIndex === -1 || digitsAfterDecimal === 0) return str
        // otherwise cut off necessary number of characters
        if (digitsAfterDecimal > maxDecimalPlaces) {
          const cutoffNumber = digitsAfterDecimal - maxDecimalPlaces
          return str.slice(0, -cutoffNumber)
        } else return str
      })
    }
  })

  if (filter.length === 0 && logicFilters.length === 0) {
    console.warn('sanitize used w/o any known filters', stringOrArray)
  }

  let outputString = ''

  // apply string mask to only keep characters within filter string
  outputString = inputString
    .split('')
    .filter(letter => filter.indexOf(letter) > -1)
    .join('')

  // use every selected logic function on the outputString
  logicFilters.forEach(fn => (outputString = fn(outputString)))

  return outputString
}
