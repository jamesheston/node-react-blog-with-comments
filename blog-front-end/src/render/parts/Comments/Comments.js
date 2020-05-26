import React from 'react';
import {withRouter} from 'react-router-dom';
import './Comments.scss';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

class Comments extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    const pathName = this.props.location.pathname;
    const slug = pathName.replace('/posts/', '');   

    return (
      <div className='Comments'>
        <h5 className='section-title'>Comments</h5>
        <CommentForm 
          slug={slug}
        />
        <CommentList 
          slug={slug}
        />
      </div>
    );
  }
}

export default withRouter(Comments);