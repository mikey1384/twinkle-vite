import React from 'react';
import { Color } from '~/constants/css';

export default function ModalContentWrapper({
  children,
  style
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: Color.wellGray(),
        position: 'relative',
        width: '100%',
        ...(style || {})
      }}
    >
      {children}
    </div>
  );
}

