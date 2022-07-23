import { Component } from 'react';
import PropTypes from 'prop-types';

export default class PreviewErrorBoundary extends Component {
  static propTypes = {
    children: PropTypes.node,
    innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    userId: PropTypes.number,
    username: PropTypes.string
  };

  state = { hasError: false };

  async componentDidCatch(error) {
    this.setState({ hasError: true });
    console.log(error);
  }

  componentDidUpdate(prevProps) {
    if (this.props.children !== prevProps.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    const { children, innerRef, ...props } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return null;
    }
    return Object.keys(props).length > 0 ? (
      <div ref={innerRef} {...props}>
        {children}
      </div>
    ) : (
      <>{children}</>
    );
  }
}
