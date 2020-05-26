import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import configureStore from './state/configureStore';
import AppRouter from './render/parts/AppRouter.js';
import * as serviceWorker from './serviceWorker';
import './render/assets/bootstrap/bootstrap.scss';
import './render/assets/general.scss';
import './render/assets/MUIButton.scss';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <AppRouter />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
