# Logic flow

## Deriving BNS State

`calcBnsState` - calculates the state of the Bitcoin Name System from transaction history, followed by final update of current block height.

  * calls batch process `runAllAutomaticActions` at each tx height.

  * calls batch process `runAllUserActions` for each tx.

## Batch Processes

Batch process calls each BNS Action from an array described in `bns/actions/batch.tsx`

`runAllAutomaticActions` - applies changes to the state that are not based on embedded data. For example, it checks ownership expiration and keeps track of any spent utxo.

`runAllUserActions` - applies changes done by embedded user actions. Every action is checked in batch.

## BNS Actions

BNS Actions are described in `bns/actions/actions.tsx`

Each action has

1. array of permissions (conditions you can check before creating tx)
2. array of conditions (checked after tx is on chain)
3. execution logic (in case permissions and conditions are met)
4. (optional: warning that's only suggestions)

When each BNS Action is called by a batch process function with current BNS state and, sometimes, transaction as arguments, it

1. checks if each condition and permission returns true (under .status())
2. only if all are true, action is executed, possibly modifying BNS state

Conditions in BNS Actions and logic inside action's execute function call on state setters and getters for chosen state data format.

## Conditions (and Permissions)

Permissions are type of conditions that can be checked before creating a transaction.

Conditions are described in `bns/actions/actions/tsx`

Each condition has

1. info - string describing the conditions
2. status - returns true or false if the condition is met or not
3. (optional: special - instructions to help creating transactions that need to meet this condition)

## State setters and getters, or Format helpers

State setters and getters that deal with the specific state format are described in `bns/formathelpers.tsx`

This is where the complexity is placed in dealing with parsing and changing BNS state's format.

The formats are typed with enums and interfaces described in `bns/types/ypes.tsx`







