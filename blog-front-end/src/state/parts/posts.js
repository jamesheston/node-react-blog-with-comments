const initialState = {
  isLoaded: false,
  posts: [],
};

export const setPosts = posts => dispatch => {
  dispatch({
    type: 'SET_POSTS',
    value: posts,
  });
};

export default (state = initialState, action) => {
  switch(action.type) {
    case 'SET_POSTS':
      return {
        ...state, 
        isLoaded: true,
        posts: action.value,
      };
    default:
      return state;
  }
};