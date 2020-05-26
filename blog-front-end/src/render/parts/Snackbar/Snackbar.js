import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {closeSnackbar} from '../../../state/parts/snackbar';
import './Snackbar.scss';
import CheckCircleOutlineIcon from 'mdi-react/CheckCircleOutlineIcon';
import CloseIcon from 'mdi-react/CloseIcon';
import ErrorOutlineIcon from 'mdi-react/ErrorOutlineIcon';
// check_circle

class Snackbar extends React.Component {
  render() {
    const {
      isOpen,
      text,
      status,
    } = {...this.props};

    return (
      <div className={"Snackbar " + (isOpen ? 'show' : '')}>
        <div className="inner-frame" role="alert" type="success"
          style={{
            opacity: 1, 
            transform: 'none', 
            transition: 'opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'}}
          >
          {/*
          Status Icon
          */}
          {this.props.status === 'success' &&
            <div className="snackbar-icon">
              <CheckCircleOutlineIcon color="#fff" size="22" />
            </div>
          }
          {this.props.status === 'error' &&
            <div className="snackbar-icon">
              <ErrorOutlineIcon color="#fff" size="22" />
            </div>
          }
          {/*
          Text
          */}
          <div className="snackbar-message">{this.props.text}</div>
          {/*
          Close Icon
          */}
          <div className="snackbar-action">
            <button className='mui-button small'
              onClick={() => {this.props.closeSnackbar();}}
            >
              <span className='icon-button-label'>
                <CloseIcon color="#fff" size="22" />
              </span>
              <span className='touch-ripple-root'></span>
            </button>
          </div>
        </div>
      </div>   
    );
  }
}

const mapStateToProps = ({ snackbar }) => {
  return {
    ...snackbar,
  };
};

const mapDispatchToProps = () => dispatch => {
  return bindActionCreators({
    closeSnackbar,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Snackbar);