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
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary
      componentPath="ButtonGroup"
      style={{ ...style, display: 'flex' }}
    >
      {buttons.map((button, index) => {
        const { skeuomorphic, filled, ...rest } = button as any;
        const mappedProps: any = {
          variant: filled ? 'solid' : skeuomorphic ? 'soft' : 'solid',
          tone: skeuomorphic ? 'raised' : undefined,
          hoverColor: button.hoverColor || button.color,
          ...rest
        };
        return (
          <Button
            key={index}
            style={{ marginLeft: index !== 0 ? '1rem' : 0 }}
            {...mappedProps}
          >
            {button.label}
          </Button>
        );
      })}
    </ErrorBoundary>
  );
}
