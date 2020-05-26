import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {closeModal} from '../../../state/parts/modal';
import './Modal.scss';

class Modal extends React.Component {
  render() {
    const {
      isOpen,
      content,
    } = {...this.props};

    return (
      <div className={'image-viewer-popup' + (isOpen ? ' show' : '')} tabIndex="-1" role="dialog">
        <a className="close-button-anchor"
          onClick={() => {this.props.closeModal()}}
        >
          <div className="close-button">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12"></circle>
              <polygon 
                className="x-shape" 
                points="17.8,16.7 16.6,17.9 12,13.3 7.4,17.9 6.2,16.7 10.8,12.1 6.2,7.5 7.4,6.3 12,11 16.6,6.4 17.8,7.6 13.2,12.2 ">
              </polygon>
            </svg>
          </div>
        </a>
        <div className='overlay'
          onClick={() => {this.props.closeModal()}}
        ></div>
        <div className='image-wrap'>
          {content}
        </div>
      </div>
    );
  }  
}

const mapStateToProps = ({ modal }) => {
  return {
    ...modal,
  };
};

const mapDispatchToProps = () => dispatch => {
  return bindActionCreators({
    closeModal,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal);