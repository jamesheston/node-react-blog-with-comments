import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk'
import rootReducer from './rootReducer';
import {loadLocalState, saveLocalState} from './localStorage';
import throttle from 'lodash/throttle';

export default function configureStore() {
  // const localSaveState = ( loadLocalState() ) ? loadLocalState() : {};
  const localSaveState = {}; 
  const initialState = localSaveState ;

  const middlewares = [thunkMiddleware];
  const enhancers = [];

  if (process.env.NODE_ENV === 'development') {
    const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;
    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension());
    }
  }

  const composedEnhancers = compose(
    applyMiddleware(...middlewares),
    ...enhancers
  );  

  const store = createStore(rootReducer, initialState, composedEnhancers); 
  
  // save state changes to local storage, but limit saving to once per second
  store.subscribe(throttle(() => {
    saveLocalState( store.getState() )
  }, 1000));
  
  return store;
};