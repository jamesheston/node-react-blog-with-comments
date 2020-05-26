import React from 'react';
import AvatarImg from './assets/avatar-3.png';

class CommentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comments: [],
      error: false,
    };
  }

  componentDidMount() {
    this.loadComments();
  }

  async loadComments() {
    const { slug } = this.props;

    try {
      const response = await fetch(`/comments/${slug}`);
      const comments = await response.json();

      console.log('comments', comments)

      if (comments.error) {
        this.setState({ error: true });
      } else {
        this.setState({ comments });
      }
    } catch (error) {
      this.setState({ error: true });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.slug !== this.props.slug) {
      this.loadComments();
    }
  }

  convertTimeStamp(timeStamp) {
    const months = ['Jan','Feb','Mar', 'Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let [y,m,d] = timeStamp.split('-');
    const month = months[ parseInt(m)-1 ];
    const day = parseInt(d.slice('0,2'));
    return `${month} ${day}, ${y}`;
  }

  render() {
    if (this.state.comments.length) {
      return (
        <ul className='CommentList'>
          {this.state.comments.map( comment => 
            <li key={comment.id}>
              <div className='avatar'>
                <img src={AvatarImg} />
              </div>
              <div className='content'>
                <div><span className='name'>{comment.name}</span><span className='time'>{this.convertTimeStamp(comment.date)}</span></div>
                <div className='text'>{comment.text}</div>
              </div>
            </li>
          )}
        </ul>
      );
    } else if (this.state.error) {
      return (
        <p className='notice'><em>Comments could not be retrieved at this time. Please try again later.</em></p>
      );      
    } else {
      return (
        <p className='notice'><em>No one has commented on this post yet. If you have something kind or constructive to say, please be the first!</em></p>
      );
    }
  }
}

export default CommentList;