import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';

export default function AdminLogWindow({
  initialPosition,
  onClose
}: {
  initialPosition: { x: number; y: number };
  onClose?: () => void;
}) {
  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition} onClose={onClose} />,
    document.body
  );
}
