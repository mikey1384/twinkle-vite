import React from 'react';
import Icon from '~/components/Icon';

export default function CloseButton({
  onClick,
  style
}: {
  onClick: () => void;
  style?: any;
}) {
  return (
    <Icon
      icon="times"
      style={{
        zIndex: 1,
        display: 'flex',
        background: '#000',
        color: '#fff',
        borderRadius: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.2rem',
        width: '2rem',
        height: '2rem',
        position: 'absolute',
        cursor: 'pointer',
        right: '-0.5rem',
        top: '-1rem',
        ...style
      }}
      onClick={onClick}
    />
  );
}
