# How data flows in app

Gloabl state is handled via react hooks in `src/store`

Global state is available to react navbar

React `Navbar` via props provides API tasks from global state for `VisualAPI` component which runs them and returns necessary value queued.

  (VisualAPI component is separated from global state for easy separation to independent module)

React `Navbar` also loads `Wallet`. It provides that component via props the interfaces for getting fee suggestions `props.api.getFeeSuggestions` and broadcasting tx `props.api.broadcastTx`. Props also links method for wallet to remember user selection for fee rates in Global state `props.export.feeRate(sats)`. `props.txBuilder = {}` pre-fills `state.network` and `state.choices.feeRate` chosen on app side.

  (Wallet component is separated from global state so I can replace this in-page wallet with wrapper that connects to extension or independent application wallet easier later)


