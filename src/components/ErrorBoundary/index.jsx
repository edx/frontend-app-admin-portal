import React from 'react';
import PropTypes from 'prop-types';
import { logError } from '@edx/frontend-platform/logging';

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    logError(error);
  }

  render() {
    return this.props.children;
  }
}

export const withErrorBoundary = WrappedComponent => props => (
  <ErrorBoundary>
    <WrappedComponent {...props} />
  </ErrorBoundary>
);

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
