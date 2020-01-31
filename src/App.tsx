import React from 'react';
import { Route, Switch } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Create from './pages/Create'
import { Navbar } from './components/Navbar'

// using for routing
const App = (): JSX.Element => {
  // onbtc.me?satoshi can now forward to onbtc.me/#/id/satoshi which resets to onbtc.me after search
  // redirect to auto searching path routed in return and remove query from url
  const searchParam = (new URLSearchParams(window.location.search)).keys().next().value
  searchParam && console.log('search param detected after ?', searchParam)
  // no forward slash before # in string is vital
  searchParam && window.history.pushState({}, '', window.location.pathname + '#/id/' + searchParam)

  return (
    <>
      {/* switch only renders first match instead of all matches */}
      <Switch>
        <Route path='/id/:alias' component={Home} />
        <Route exact path='/id/' component={Home} />
        <Route path="/about" component={About} />
        <Route path="/create" component={Create} />
        <Route path='/:noise' component={Home} />
        <Route exact path='/' component={Home} />
      </Switch>
      <Navbar />
      {/* <Route exact path="/" render={() => <Home />} /> */}
    </>
  );
}
export default App;
