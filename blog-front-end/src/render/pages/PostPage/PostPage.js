import React from 'react';
import {Link, withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import DefaultLayout from '../../parts/DefaultLayout/DefaultLayout';
import PostContent from './PostContent';
import Comments from '../../parts/Comments/Comments';
// import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
// import {faCalendar} from '@fortawesome/free-solid-svg-icons';
import '../../assets/prismjs/prism.css';
import '../../assets/prismjs/prism-okaidia.css';
import './PostPage.scss';
import './markdown.scss';


class PostPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: true,
      postIndex: 0,
      tags: [],
      date: '',
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if( this.state.title !== nextState.title || this.props.location.pathname !== nextProps.location.pathname ) {
      return true;
    }
    if( this.state.hidden !== nextState.hidden ) {
      return true;
    }
    return false;
  }

  componentDidMount() {
    this.setPost();
  }

  componentDidUpdate(prevProps, prevState) {
    if( this.props.location.pathname !== prevProps.location.pathname ) {
      this.setPost();
    }
  }

  setPost() {
    let postIndex = 0;
    const post = this.props.posts.find( (p, i) => {
      postIndex = i;
      return this.props.location.pathname.indexOf(p.slug) !== -1;
    });   

    this.setState({ ...post, postIndex, hidden: true }, () => {
      window.scroll(0, 0);
      // if I don't use setTimeout with a little delay, the CSS animation doesn't get 
      // triggered by by toggling the 'hide' class 
      setTimeout( () => {
        this.setState({ hidden: false });
      }, 100);
    }); 
  }

  render() {
    const posts = this.props.posts;

    let prevPostI = this.state.postIndex - 1;
    if( prevPostI === -1 ) {
      prevPostI = posts.length - 1;
    }
    let nextPostI = (this.state.postIndex + 1) % posts.length;
    const prevPost = posts[prevPostI];
    const nextPost = posts[nextPostI];
    const maxChars = 100;
    const prevPostTitle = prevPost.title.slice(0, maxChars);
    const nextPostTitle = nextPost.title.slice(0, maxChars);

    return (
      <DefaultLayout>
        <div className='PostPage container'>
          <div className={'page-content-wrap' + (this.state.hidden ? ' hide': '')}>
            <header>
              <h1>{this.state.title}</h1>
              <div className='post-meta d-flex align-items-between'>
                <div className='date'>
                  <span>Posted {this.formatDate(this.state.date)}</span>
                </div>
                <div className='tags'>
                  {this.state.tags.map( (tag, i) => {
                    return (
                      <div key={i} className='chip'><span>{tag}</span></div>  
                    );                  
                  })}
                </div>
              </div>
            </header>
            <article>
              <div className="markdown">
                <PostContent markdown={this.state.body} />
              </div>
            </article>
            {/*
            Post Footer Pager
            */}
            <div className='post-footer-pager'>
              <div className='pager-nav-item'>
                <Link className='pager-nav-link' to={'/posts/' + prevPost.slug}>
                  <div className='sublabel'>&laquo; Previous Post</div>
                  <div className='label'>{prevPostTitle}</div>
                </Link>
              </div>
              <div className='pager-nav-item'>
                <Link className='pager-nav-link' to={'/posts/' + nextPost.slug}>
                  <div className='sublabel'>Next Post &raquo;</div>
                  <div className='label'>{nextPostTitle}</div>
                </Link>
              </div>            
            </div>
            {/*
            Post Comments
            */}
            <Comments />
          </div>
        </div>
      </DefaultLayout>
    );
  }

  formatDate(n) {
    const str = n.toString();
    const yN = str.slice(0, 4);
    const mN = parseInt(str.slice(4, 6)) - 1;
    const dN = parseInt(str.slice(6, 8));
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[mN];
    return month + ' ' + dN + ', ' + yN;
  }
}

const mapStateToProps = ({ posts }) => {
  return {
    posts: posts.posts,
  };
};

export default connect(mapStateToProps)(withRouter(PostPage));