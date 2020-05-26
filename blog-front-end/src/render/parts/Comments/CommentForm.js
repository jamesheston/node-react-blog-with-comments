import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {openSnackbar, closeSnackbar} from '../../../state/parts/snackbar';

class CommentForm extends React.Component {
  constructor(props) {
    super(props);
    this.initialState = {
      name: '',
      text: '',
      post: this.props.slug,
      submitting: false,
      success: false,
      error: false,      
    }
    this.state = this.initialState;
  }

  onSubmitComment = async event => {
    event.preventDefault()
  
    // Set this so the button can't be pressed repeatedly
    this.setState({ submitting: true });

    const { slug } = this.props;

    const newComment = {
      name: this.state.name,
      text: this.state.text,
      post: slug,
    };

    try {
      // POST to /comments
      const response = await fetch('/comments', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'post',
        body: JSON.stringify(newComment),
      });
      
      const r = await response.json();
      if (r.error) {
        throw 'Error';
        this.props.openSnackbar('There was an error submitting your comment.', 'error');
      } else {
        // Append comment and reset newComment
        this.setState(prevState => ({
          name: '',
          text: '',
          post: slug,
          success: true,
          error: false,
        }));
        this.props.openSnackbar('Your comment was submitted successfully!', 'success');
        // setTimeout(() => {
        //   this.props.closeSnackbar();
        // }, 8000);
      }

    } catch (error) {
      this.setState({ ...this.initialState, post: slug, error: true });
      this.props.openSnackbar('There was an error submitting your comment.', 'error');
    }
  }

  handleChange = event => {
    const { name, value } = event.target;
  
    this.setState({
      [name]: value
    });
  }  

  render() {
    return (
      <React.Fragment>
        <form className='CommentForm' onSubmit={this.onSubmitComment}>
          <div className="form-group">
            <input 
              className="form-control" id="comment-name-field"          
              type="text" 
              name="name" 
              value={this.state.name} 
              onChange={this.handleChange}
              maxLength="255"
              placeholder="Your name"
              required
            />
          </div>
          <div className="form-group">
            <textarea 
              className="form-control" id="comment-text-field" 
              name="text"
              value={this.state.text}
              onChange={this.handleChange}
              rows="3"
              placeholder="Your comment" 
              required
            />
          </div>     
          <button 
            className="btn btn-primary"
            type="submit"
            disabled={!this.state.name || !this.state.text || this.state.text.length < 20 || this.state.submitting}
            >
              Post Comment
          </button>     
        </form>
      </React.Fragment>
    );
  }
}

// const mapStateToProps = ({ modal }) => {
//   return {
//     ...modal,
//   };
// };

const mapDispatchToProps = () => dispatch => {
  return bindActionCreators({
    openSnackbar,
    closeSnackbar,
  }, dispatch);
}

export default connect(null, mapDispatchToProps)(CommentForm);