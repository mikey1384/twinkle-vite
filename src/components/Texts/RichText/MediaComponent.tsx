import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import PropTypes from 'prop-types';

MediaComponent.propTypes = {
  src: PropTypes.string.isRequired
};
export default function MediaComponent({ src }: { src: string }) {
  return (
    <ErrorBoundary componentPath="Texts/RichText/MediaComponent">
      <img src={src} />
    </ErrorBoundary>
  );
}
