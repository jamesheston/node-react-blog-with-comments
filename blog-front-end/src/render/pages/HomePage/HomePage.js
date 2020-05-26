import React from 'react';
import DefaultLayout from '../../parts/DefaultLayout/DefaultLayout';

class HomePage extends React.Component {
  render() {
    return (
      <DefaultLayout>
        <div className='HomePage container'>
          <div className='page-content-wrap'>
            <header>
              <h1>Recent Posts</h1>
            </header>
          </div>          
        </div>
      </DefaultLayout>
    );
  }
}

export default HomePage;