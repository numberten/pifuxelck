import { createBrowserHistory } from 'history';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Router, Switch } from 'react-router';
import * as actions from './actions';
import ScrollToTop from './components/scroll-to-top';
import App from './containers/app';
import ErrorSnaks from './containers/error-snaks';
import Login from './containers/login';
import Register from './containers/register';
import startStats from './stats-index';
import { createPifuxelckStore } from './store';

import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore,
  Reducer,
} from 'redux';

const {
  ConnectedRouter,
  routerReducer,
  routerMiddleware,
} = require('react-router-redux');

(window as any).startStats = startStats;
(window as any).startApp = () => {
  // Hookup offline support.
  require('offline-plugin/runtime').install();

  // Create a history of your choosing (we're using a browser history in this
  // case).
  const history = createBrowserHistory();

  // TODO(will): Need to handle errors here...
  createPifuxelckStore(history)
    .then((store) => {
      store.dispatch(actions.getAllData());
      return store;
    })
    .then((store) => {
      ReactDOM.render(
        <MuiThemeProvider>
          <Provider store={store}>
            <ConnectedRouter history={history}>
              <ScrollToTop>
                <div>
                  <Switch>
                    <Route path='/login' component={Login} />
                    <Route path='/register' component={Register} />
                    <Route path='/' component={App} />
                  </Switch>
                  <ErrorSnaks />
                </div>
              </ScrollToTop>
            </ConnectedRouter>
          </Provider>
        </MuiThemeProvider>,
        document.getElementById('content'),
      );
    });
};
