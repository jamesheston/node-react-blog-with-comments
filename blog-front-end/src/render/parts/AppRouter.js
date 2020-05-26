import React from 'react';
import {connect} from 'react-redux';
import {BrowserRouter as Router, Route, Switch, Redirect, useParams} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {setPosts} from '../../state/parts/posts';
import PostPage from '../pages/PostPage/PostPage';
import LoadingScreen from './LoadingScreen/LoadingScreen';

class AppRouter extends React.Component {
  constructor(props) {
    super(props);
    
    if(! this.props.postsAreLoaded) {
      this.fetchPosts();
    }
  }

  fetchPosts() {
    fetch(`/api/posts`).then(response => response.json()).then(json => {
      setTimeout( () => {
        this.props.setPosts(json);
      }, 500);
    });
  }  

  render() {
    const {
      posts, 
      postsAreLoaded
    } = {...this.props};
    const latestPost = posts[posts.length - 1];

    return (
      <React.Fragment>
        {!postsAreLoaded ? (
          <LoadingScreen />
        ) : (
          <Router>
            <Switch>
              <Route path='/demos/:slug' component={DemoChild} />
              <Route exact path='/' render={() => <Redirect to={{ pathname: '/posts/' + latestPost.slug }} />} />
              <Route path='/posts' component={PostPage} />
            </Switch>
          </Router>
        )}
      </React.Fragment>
    );
  }
}

function DemoChild() {
  let { slug } = useParams();
  document.location.href = '/demos/' + slug; // this is a hack because line below doesn't work
  return <Redirect to={{ pathname: '/demos/' + slug }} target='_self' />;
}

const mapStateToProps = ({ posts }) => {
  return {
    postsAreLoaded: posts.isLoaded,
    posts: posts.posts,
  };
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    setPosts,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);