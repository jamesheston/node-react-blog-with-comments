import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {childrenTextToId} from './PostContent';
import './PostContentTree.scss';

class PostContentTree extends React.Component {
  constructor(props) {
    super(props);

    this.listenToScroll = this.listenToScroll.bind(this);

    this.state = {
      hidden: true,      
      postIndex: 0,
      body: '',
      // scrollTargetI: 1,
    };    
  }

  shouldComponentUpdate(nextProps, nextState) {
    if( this.state.title !== nextState.title || this.props.location.pathname !== nextProps.location.pathname ) {
      return true;
    }
    if( this.state.hidden !== nextState.hidden ) {
      return true;
    }
    if( this.props.location !== nextProps.location ) {
      return true;
    }
    return false;
  }

  componentDidMount() {
    this.setPost();
    window.addEventListener('scroll', this.listenToScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.listenToScroll)
  }

  componentDidUpdate(prevProps, prevState) {
    if( this.props.location.pathname !== prevProps.location.pathname ) {
      this.setPost();
    }
  }

  listenToScroll() {
    const yScrolled = window.pageYOffset + document.documentElement.clientHeight;
    // this.setState({
    //   theposition: window.pageYOffset,
    // })    
  }

  setPost() {
    let postIndex = 0;
    const post = this.props.posts.find( (p, i) => {
      postIndex = i;
      return this.props.location.pathname.indexOf(p.slug) !== -1;
    });   

    this.setState({ ...post, postIndex, hidden: true }, () => {
      // if I don't use setTimeout with a little delay, the CSS animation doesn't get 
      // triggered by by toggling the 'hide' class 
      setTimeout( () => {
        this.setState({ 
          hidden: false,
        }, () => {
          
        });
      }, 100);

      // build a list of y offsets for each heading in the post body.
      // we'll then compare the current scroll y offset to these values to
      // determine which heading should be marked as the current one in the
      // table of contents
      let headings = document.querySelectorAll('.PostPage .markdown h2, .PostPage .markdown h3, .PostPage .markdown h4, .PostPage .markdown h5');
      headings = [...headings];

      if (headings.length > 0) {
        let headingYOffsets = headings.map( el => el.offsetTop );
        this.setState({ headingYOffsets });
      }
    }); 
  }

  render() {
    const currentLocationHash = this.props.location.hash;

    const Heading = ({ level, children, index }) => {
      const targetLocationHash = '#' + childrenTextToId(children);
      let activeClass = '';
      if (currentLocationHash === targetLocationHash) {
        activeClass = ' active';
      } else if ( currentLocationHash === '' && index === 0  ) {
        activeClass = ' active';
      }

      return (
        <li><a 
          className={'he' + level + activeClass}
          href={targetLocationHash}        
        >{children}
        </a></li>
      );
    }


    return (
      <div className='PostContentTree'>
          <h6>Contents</h6>
          <ul className='list-unstyled'>          
            <ReactMarkdown
              source={this.state.body}
              allowedTypes={['heading', 'text', 'inlineCode']}
              includeNodeIndex={true}
              allowNode={(node) => {
                return true;
              }}
              renderers={{
                heading: Heading,
              }}
            />
          </ul>
      </div>
    );
  }
}

const mapStateToProps = ({ posts }) => {
  return {
    posts: posts.posts,
  };
};

export default connect(mapStateToProps)(withRouter(PostContentTree));