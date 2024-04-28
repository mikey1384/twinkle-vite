import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import ciel from '~/assets/ciel.png';

export default function CielButton({ style }: { style?: React.CSSProperties }) {
  return (
    <ErrorBoundary componentPath="Buttons/ZeroButton">
      <Button
        style={{
          background: `no-repeat center/80% url(${ciel})`,
          ...style
        }}
        skeuomorphic
        onClick={() => console.log('clicked')}
      >
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </Button>
    </ErrorBoundary>
  );
}
