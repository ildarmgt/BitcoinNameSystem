import React from 'react'
import styles from './Sending.module.css'
import { FeesSelection } from './../../../../general/FeesSelection'
import { InputForm } from './../../../../general/InputForm'
import { I_Wallet, I_TxBuilder, Mode } from './../../interfaces'
import { RoundButton } from '../../../../general/RoundButton'

export const Sending = (props: any): JSX.Element => {
  const {
    wallet,
    setWallet,
    txBuilder,
    setTxBuilder,
    recalcBuilder,
    setShowInterface
  }: {
    wallet: I_Wallet
    setWallet: (param: I_Wallet) => any
    txBuilder: I_TxBuilder
    setTxBuilder: (param: I_TxBuilder) => any
    recalcBuilder: any
    setShowInterface: any
  } = props.passedstate

  return (
    <>
      <div className={styles.title}>{wallet.headline}</div>

      {/* allow fee customization */}
      <FeesSelection
        className={styles.feeSelection}
        initialFee={txBuilder.feeRate}
        getFeeSuggestions={() => props.api.getFeeSuggestions()}
        setFee={(feeRate: string) => {
          if (+feeRate > txBuilder.maxFeeRate)
            feeRate = String(txBuilder.maxFeeRate)
          if (+feeRate < txBuilder.minFeeRate)
            feeRate = String(txBuilder.minFeeRate)
          props.export.feeRate(parseFloat(feeRate)) // outside wallet
          setTxBuilder({ ...txBuilder, feeRate: parseFloat(feeRate) }) // inside wallet
          return feeRate
        }}
      />

      {/* amount customization */}
      {Object.keys(txBuilder.outputsFixed).map(
        (vout: string, index: number) => {
          const output = txBuilder.outputsFixed[vout]
          return (
            <InputForm
              key={'outputform' + String(index)}
              className={styles.amounts}
              thisInputLabel={
                <>
                  #{vout} Sending {(output.value * 1e-8).toFixed(8)}{' '}
                  {txBuilder!.network === 'testnet' ? 'tBTC' : 'BTC'} to{' '}
                  <span className={'letter_breakable'}>{output.address}</span>
                </>
              }
              showButton={'false'}
              thisInitialValue={(output.value * 1e-8).toFixed(8)}
              onBlur={() => (output.value * 1e-8).toFixed(8)}
              sanitizeFilters={[
                'fractions',
                'decimal_point',
                'no_leading_zeros',
                'max_decimal_places:8'
              ]}
              thisInputOnChange={(e: any) => {
                // convert string in BTC to number of satoshi
                const thisValue = Math.round(+e.target.value * 1e8)
                // change the fixed output value
                // const isChanged = output.value !== thisValue
                output.value = thisValue
                e.target.value = String(+(output.value * 1e-8).toFixed(8))

                // update builder and wallet state w/ new change
                const lastError = recalcBuilder({ txBuilder })
                setWallet({ ...wallet, lastError })
                setTxBuilder({ ...txBuilder })
              }}
            />
          )
        }
      )}

      {/* calculated outputs */}
      {Object.keys(txBuilder.outputs).map((vout: string, index: number) => {
        // make sure it's not fixed output
        if (txBuilder.outputsFixed[vout])
          return <div key={`calcoutput_${index}`}></div>
        const output = txBuilder.outputs[vout]
        console.log(`calc outputs:`, vout, output.value)
        return (
          <div
            className={[styles.calculatedAmounts, 'word_breakable'].join(' ')}
            key={`calcoutput_${index}`}
          >
            #{vout} Sending {(+output.value * 1e-8).toFixed(8)}{' '}
            {txBuilder.network === 'testnet' ? 'tBTC' : 'BTC'}
            {output.info ? ` for ${output.info} ` : ' '}to{' '}
            <span className={'letter_breakable'}>{output.address}</span>
          </div>
        )
      })}

      {/* status */}
      {!!wallet.lastError && (
        <div className={[styles.lastError, 'word_breakable'].join(' ')}>
          {wallet.lastError}
        </div>
      )}

      <div className={styles.buttonWrapper}>
        <RoundButton
          minor={'true'}
          onClick={() => {
            setShowInterface(false)
          }}
        >
          Cancel
        </RoundButton>
        <RoundButton
          showdisabled={txBuilder.result.hex ? undefined : 'true'}
          onClick={async () => {
            console.log('Send clicked')
            // abort if no hex
            if (txBuilder.result.hex === '') return undefined
            console.log('attempting to broadcast')
            console.log('hex:\n', txBuilder!.result.hex)
            try {
              const res = await props.api.broadcastTx(txBuilder.result.hex)
              console.log('broadcast success:', res)
              // add this to historic events
              wallet.history.push({
                describe: `outgoing transaction`,
                txid: res.txid,
                message: '',
                success: true,
                txBuilder: JSON.parse(JSON.stringify(txBuilder)),
                timestamp: Date.now()
              })
            } catch (e) {
              console.log('broadcast failed:', e)
              // add this to historic events
              wallet.history.push({
                describe: `outgoing transaction`,
                txid: '',
                message: e.message,
                success: false,
                txBuilder: JSON.parse(JSON.stringify(txBuilder)),
                timestamp: Date.now()
              })
            }
            wallet.mode = Mode.HISTORY
            setWallet({ ...wallet })
          }}
        >
          Send
        </RoundButton>
      </div>
    </>
  )
}
