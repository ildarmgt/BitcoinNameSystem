import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import './css/global.css';
import App from './App';
import { StoreProvider } from './store/'
import { DevPanel } from './components/DevPanel'

// Using for store access and hash router base
ReactDOM.render(
  <React.StrictMode>
    <StoreProvider>
      <HashRouter>
        <App />
      </HashRouter>
      <DevPanel />
    </StoreProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.register();
// import * as serviceWorker from './serviceWorker';