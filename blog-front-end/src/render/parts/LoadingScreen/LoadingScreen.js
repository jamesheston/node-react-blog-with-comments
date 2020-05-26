import React from 'react';
import {ReactComponent as LogoSVG} from '../../assets/logo-01.svg';
import './LoadingScreen.scss';

class LoadingScreen extends React.Component {
  render() {
    return (
      <div className='LoadingScreen'>
        <div className='logo-wrap'>
          <LogoSVG className='spinning'/>
        </div>
      </div>
    );
  }
}

export default LoadingScreen;