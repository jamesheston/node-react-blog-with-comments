import React from 'react';

const initialState = {
  isOpen: false,
  content: <React.Fragment></React.Fragment>,
};

export const openModal = content => dispatch => {
  dispatch({
    type: 'OPEN_MODAL',
    value: content,
  });
};

export const closeModal = () => dispatch => {
  dispatch({
    type: 'CLOSE_MODAL'
  });
};

export default (state = initialState, action) => {
  switch(action.type) {
    case 'OPEN_MODAL':
      return {
        isOpen: true,
        content: action.value,
      };
    case 'CLOSE_MODAL':
      return {
        isOpen: false,
        content: <React.Fragment></React.Fragment>,
      };
    default:
      return state;
  }
};