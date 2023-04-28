import React from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function ButtonGroup({
  buttons,
  style
}: {
  buttons: {
    label: string;
    color: string;
    disabled?: boolean;
    filled?: boolean;
    hoverColor?: string;
    skeuomorphic?: boolean;
    onClick: () => void;
  }[];
  style?: {
    [key: string]: any;
  };
}) {
  return (
    <ErrorBoundary
      componentPath="ButtonGroup"
      style={{ ...style, display: 'flex' }}
    >
      {buttons.map((button, index) => {
        return (
          <Button
            key={index}
            style={{ marginLeft: index !== 0 ? '1rem' : 0 }}
            {...button}
            hoverColor={button.hoverColor || button.color}
          >
            {button.label}
          </Button>
        );
      })}
    </ErrorBoundary>
  );
}
