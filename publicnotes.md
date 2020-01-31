# TypeError: Cannot read property opcodes of undefined

The errors of this type for bitcoinjs-lib:

After 4.0.3 release have to import the library like this:

`import * as bitcoin from 'bitcoinjs-lib'`

instead of like

`import bitcoin from 'bitcoinjs-lib'`

or it doesn't work.