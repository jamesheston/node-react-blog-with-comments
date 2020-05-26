import React from 'react';
import PostContentTree from '../../pages/PostPage/PostContentTree';

class RightSidebar extends React.Component {
  render() {
    return (
      <div className='RightSidebar Sidebar'>
        <PostContentTree />
      </div>
    );
  }
}

export default RightSidebar;