import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {setPosts} from '../../../state/parts/posts';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Modal from '../Modal/Modal';
import LogoSVG from '../../assets/logo-01.svg';
import {ReactComponent as HamburgerSVG} from '../../assets/feather-icons__menu.svg';
import {Link} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import ReactTooltip from 'react-tooltip';
import Snackbar from '../Snackbar/Snackbar';
import './DefaultLayout.scss';
import './site-header.scss';
import './LeftSidebar.scss';


class DefaultLayout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileNavOpen: false,
    };
  }

  render() {
    const mobileNavClass = (this.state.mobileNavOpen) ? ' mobile-nav-open' : '';
    return (
      <div className='DefaultLayout'>
        {/*
        Site Header
        */}
        <nav className="site-header navbar fixed-top p-0">
          <Link to='/' className='header-logo-link'>
            <img src={LogoSVG} alt='' />
          </Link>
          <Link className="navbar-brand" to="/"><span>James Heston</span></Link>
          <button className='mobile-nav-toggle d-xl-none unstyled'
            onClick={() => {this.setState({ mobileNavOpen: !this.state.mobileNavOpen });}}
          ><HamburgerSVG style={{stroke: '#fff', opacity: '0.95'}} /></button>
          <div className='header-icons'>
            {/* 
            <a target='_blank' href={'//github.com/jamesheston'} rel="noopener noreferrer"><FontAwesomeIcon icon={faGithub} color={'#FFF'} style={{fontSize: '32px', opacity: '0.95'}}/></a>
            */}
            <a className='button_base icon_button' data-tip data-for='github-profile-tooltip'
              target='_blank' href={'//github.com/jamesheston'} rel="noopener noreferrer"
            >
              <span className='icon_button_label'>
                {/* <svg className='svg_icon'></svg> */}
                <FontAwesomeIcon className='svg_icon' icon={faGithub} color={'#FFF'}/>
              </span>
              <span className='touch_ripple'></span>
            </a>   
            <ReactTooltip 
              id='github-profile-tooltip' 
              className='custom-tooltip'
              effect='solid' 
              place='bottom'
            >
                <span>Github profile</span>
            </ReactTooltip>         
            </div>          
        </nav>
        <div className="d-flex">
          {/*
          Left Sidebar - Posts List 
          */}
          <nav className={"site-sidebar-wrap left-sidebar-wrap sidebar d-none d-xl-flex" + mobileNavClass}>
            <div className="sidebar-sticky">
              <LeftSidebar />
            </div>
          </nav>
          {/*
          Main Column - Page Content
          */}
          <main role="main" className="site-main-col d-flex">
            {this.props.children} {/* <--- page content */}           
          </main>
          {/*
          Right Sidebar
          */}
          <nav className="site-sidebar-wrap right-sidebar-wrap sidebar d-none">
            <div className="sidebar-sticky">
              <RightSidebar />
            </div>
          </nav>
        </div>
        {/*
        Popup Modal
        */}
        <Modal />
        {/*
        Snackbar
        */}
        <Snackbar />
      </div>
    );
  }
}

const mapStateToProps = ({ posts }) => {
  return {
    postsAreLoaded: posts.isLoaded,
  };
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    setPosts,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(DefaultLayout);