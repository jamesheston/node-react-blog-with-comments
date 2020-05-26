import React from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {openModal} from '../../../state/parts/modal';
import {createElement} from 'react';

class CodeBlock extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }
  componentDidMount() {
    this.highlight();
  }
  componentDidUpdate() {
    this.highlight();
  }
  highlight = () => {
    if (this.ref && this.ref.current) {
      Prism.highlightElement(this.ref.current);
    }
  }
  render() {
    const { language, value } = this.props;
    return (
      <pre className={''}>
        <code ref={this.ref} className={`language-${language}`}>
          {value}
        </code>
      </pre>      
    );
  }
}

class CustomLink extends React.Component {
  render() {
    // exernal links start with '//' or 'http' 
    const isExternalLink = /^\/\/|^http/.test(this.props.href);
    if (isExternalLink) {
      return (
        <Link to={this.props.href} target='_blank'>{this.props.children}</Link>
      );
    } else {
      return (
        <Link to={this.props.href}>{this.props.children}</Link>
      );
    }

  }
}

class ExpandableImage extends React.Component {
  render() {
    return (
      <img className='expandable_image' src={this.props.src} alt={this.props.alt} 
        onClick={() => {this.props.openModal(<img className='expandable_image' src={this.props.src} alt={this.props.alt} />)}}
      />
    );
  }
}

const childrenTextToId = (children) => {
  // grab and concat text from child nodes
  const innerStr = children.reduce( (a,b) => a + b.props.value, '');
  // handleize string, e.g. transform ""Update Level.generate() to add enemies to rooms" to 
  // "update-level-generate-to-add-enemies-to-rooms"
  return innerStr.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');  
}

class Heading extends React.Component {  
  render() {
    const id = childrenTextToId(this.props.children);
    return createElement(`h${this.props.level}`, {...this.props, className:'test', id}, this.props.children);
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    openModal,
  }, dispatch);
};


class PostContent extends React.Component {
  render() {
    return <ReactMarkdown 
      source={this.props.markdown} 
      renderers={{
        code: CodeBlock,
        link: CustomLink,
        heading: Heading,
        image: connect(null, mapDispatchToProps)(ExpandableImage),
    }} />;
  }
}

export {childrenTextToId};
export default PostContent;