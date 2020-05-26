import React from 'react';

const initialState = {
  isOpen: false,
  text: '',
  status: 'default', // 'default', 'success', 'error'
};

export const openSnackbar = (text, status = 'default') => dispatch => {
  dispatch({
    type: 'OPEN_SNACKBAR',
    text,
    status
  });
};

export const closeSnackbar = () => dispatch => {
  dispatch({
    type: 'CLOSE_SNACKBAR'
  });
};

export default (state = initialState, action) => {
  switch(action.type) {
    case 'OPEN_SNACKBAR':
      return {
        isOpen: true,
        text: action.text,
        status: action.status
      };
    case 'CLOSE_SNACKBAR':
      return {
        ...state,
        isOpen: false,
      };
    default:
      return state;
  }
};