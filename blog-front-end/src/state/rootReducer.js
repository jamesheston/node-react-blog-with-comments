import {combineReducers} from 'redux';
import posts from './parts/posts';
import modal from './parts/modal';
import snackbar from './parts/snackbar';

export default combineReducers({
  posts,
  modal,
  snackbar,
});