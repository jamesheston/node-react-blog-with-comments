import React from 'react';
import './Comments.scss';
import AvatarImg from './assets/avatar1.jpg';

const comments = [
  {
    id: 0,
    time: 'Today at 5:42pm',
    name: 'Matt',
    text: 'How artistic!'
  },
  {
    id: 1,
    time: 'Yesterday at 12:30AM',
    name: 'Elliot Fu',
    text: 'This has been very useful for my research. Thanks as well!'
  },
  {
    id: 2,
    time: 'Just now',
    name: 'Jenny Hess',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
  },
  {
    id: 3,
    time: '5 days ago',
    name: 'Joe Henderson',
    text: 'Dude, this is awesome. Thanks so much'
  },
];

export default class Comments extends React.Component {
  render() {
    return (
      <div className='Comments'>
        <h5 className='section-title'>Comments</h5>

        <form className='CommentForm'>

          <div class="form-group">
            {/*<label for="exampleFormControlInput1">Name</label>*/}
            <input type="text" class="form-control" id="comment-name-field" placeholder="Your name"/>
          </div>
          <div class="form-group">
            {/*<label for="exampleFormControlTextarea1">Comment</label>*/}
            <textarea class="form-control" id="comment-text-field-" placeholder="Your comment" rows="3"></textarea>
          </div>     
          <button type="button" class="btn btn-primary">Post Comment</button>     
        </form>

        <ul className='CommentList'>
          {comments.map( comment => 
            <li key={comment.id}>
              <div className='avatar'>
                <img src={AvatarImg} />
              </div>
              <div className='content'>
                <div><span className='name'>{comment.name}</span><span className='time'>{comment.time}</span></div>
                <div className='text'>{comment.text}</div>
              </div>
            </li>
          )}
        </ul>
        
        <p style={{color: '#666'}}><em>No one has commented on this post yet. If you have something kind or constructive to say, please be the first!</em></p>

        {/*
        <CommentForm />
        <CommentList />
        */}
      </div>
    );
  }
}

class CommentForm extends React.Component {
  render() {
    return (
      <div className='CommentForm'>

      </div>
    );
  }
}

class CommentList extends React.Component {
  render() {
    return (
      <div className='CommentList'>

      </div>
    );
  }
}