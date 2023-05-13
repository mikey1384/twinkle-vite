import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function InterfaceComponent({ src }: { src: string }) {
  return (
    <ErrorBoundary componentPath="Texts/EmbeddedComponent/InternalComponent">
      <div>internal component {src}</div>
    </ErrorBoundary>
  );
}
