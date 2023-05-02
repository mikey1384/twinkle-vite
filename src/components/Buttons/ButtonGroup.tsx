import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';

ButtonGroup.propTypes = {
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      filled: PropTypes.bool,
      hoverColor: PropTypes.string,
      skeuomorphic: PropTypes.bool,
      onClick: PropTypes.func.isRequired
    })
  ).isRequired,
  style: PropTypes.object
};
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
