import React from 'react';
// import {posts} from '../../../data/posts';
import {Link, NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSearch} from '@fortawesome/free-solid-svg-icons';
import {ReactComponent as SearchSVG} from '../../assets/search-icon.svg';

class LeftSidebar extends React.Component {
  constructor(props) {
    super(props);
    this.$PostsList = React.createRef();
    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.handleTagFiltersChange = this.handleTagFiltersChange.bind(this);
  }
  handleSearchInputChange(q) {
    this.$PostsList.current.handleSearchInputChange(q);
  }
  handleTagFiltersChange(activeTags) {
    this.$PostsList.current.handleTagFiltersChange(activeTags);
  }
  render() {
    return (
      <div className='LeftSidebar Sidebar'>
        <div className='upper-wrap'>
          <PostsSearchInput handleSearchInputChange={this.handleSearchInputChange} />
          <PostsList ref={this.$PostsList} posts={this.props.posts}/>
        </div>
        <PostsTags handleTagFiltersChange={this.handleTagFiltersChange} posts={this.props.posts} />
      </div>
    );
  }
}

class PostsTags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {activeTags: []};
  }
  toggleTag(tag) {
    let activeTags; 
    if( this.state.activeTags.indexOf(tag) === -1 ) {
      activeTags = [...this.state.activeTags, tag];
    } else {
      activeTags = this.state.activeTags.filter( t => t !== tag );
    }
    this.setState({activeTags}, () => {
      this.props.handleTagFiltersChange(this.state.activeTags);
    });
  }
  render() {
    const tags = getTagsFromPosts(this.props.posts);
    return (
      <div className='tags' style={{padding: '15px'}}>
        {tags.map( (tag, i) => {
          const activeClass = (this.state.activeTags.indexOf(tag) !== -1) ? '' : ' disabled'; 
          return (
            <div key={i} className={'chip' + activeClass}
              onClick={() => {this.toggleTag(tag)}}
            ><span>{tag}</span></div>
          );
        })}
      </div>      
    )
  }
}

class PostsSearchInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { q: '' };
    this.handleQueryChange = this.handleQueryChange.bind(this);
  }
  handleQueryChange(event) {
    this.props.handleSearchInputChange(event.target.value);
    this.setState({ q: event.target.value });
  }
  render() {
    return (
      <form className='search'>
        <div className='input-wrap'>
          <a className='search-button'>
            <SearchSVG className='svg' style={{fill: '#1f2227'}} />
          </a>

          <input type='search' className='form-control' placeholder='search titles' 
            value={this.state.q} 
            onChange={this.handleQueryChange}  
          />
        </div>

      </form>
    );
  }
}

class PostsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      q: '', 
      matchingPosts: this.props.posts, 
      activeTags: [],
    };
    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.handleTagFiltersChange = this.handleTagFiltersChange.bind(this);
  }
  handleSearchInputChange(q) {
    this.setState({ q }, () => {
      this.setState({ matchingPosts: this.getFilteredPosts() });
    });
  }
  handleTagFiltersChange(activeTags) {
    this.setState({ activeTags }, () => {
      this.setState({ matchingPosts: this.getFilteredPosts() });
    });
  }
  getFilteredPosts() {
    let filteredPosts = this.props.posts.slice();
    // first, filter by tags
    if( this.state.activeTags.length !== 0 ) {
      filteredPosts = filteredPosts.filter( (post) => {
        let isMatch = false;
        post.tags.forEach( (tag) => {
          if( this.state.activeTags.indexOf(tag) !== -1 ){
            isMatch = true;
          }
        })
        return isMatch;
      });
    }
    // then, further filter by search query against title
    filteredPosts = filteredPosts.filter( (post) => {
      const rgx = new RegExp(this.state.q, 'i'); // case insensitive
      return rgx.test(post.title);
    });
    return filteredPosts;
  }
  render() {
    return (
      <ul className="nav flex-column posts-list">
        {this.state.matchingPosts.map( (post, i) => {
          return (
            <PostsListItem 
              key={i} 
              href={"/posts/" + post.slug} 
              title={post.title}
              date={post.date}
              q={this.state.q} 
            />
          );
        })}
      </ul>
    );
  }
}

class PostsListItem extends React.Component {
  render() {
    return (
      <li className="nav-item">
        <div className='date'>
          <div className='month'>JAN</div>
          <div className='year'>2020</div>
        </div>
        <NavLink className="nav-link" to={this.props.href}>
          {/*<span>{formatDate(this.props.date)}</span>*/}
          <span dangerouslySetInnerHTML={highlightQueryInTitle(this.props.title, this.props.q)}></span>
        </NavLink>
      </li>
    );
  }
}

function formatDate(n) {
  const str = n.toString();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = months[parseInt(str.slice(4, 6))];
  const d = str.slice(6, 8);
  const y = str.slice(0,4);
  return m + ' ' + d + ', ' + `${y}`;
}

function highlightQueryInTitle(title, q) {
  let markup = '';
  if( q === '' ) {
    markup = title;
  } else {
    const rgx = new RegExp('(' + q + ')', 'gi');
    markup = title.replace(rgx, '<strong>' + "$1" + '</strong>');    
  }
  return {__html: markup};
}

function getTagsFromPosts(posts) {
  return posts.reduce( (a, post, i) => {
    const newTags = post.tags.filter( (tag) => a.indexOf(tag) === -1);
    return [...a, ...newTags];
  }, []);
}

const mapStateToProps = ({posts}) => {
  return {
    posts: posts.posts,
  };
};

export default connect(mapStateToProps)(LeftSidebar);