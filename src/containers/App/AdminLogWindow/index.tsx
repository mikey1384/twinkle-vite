import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';

export default function AdminLogWindow({
  initialPosition
}: {
  initialPosition: { x: number; y: number };
}) {
  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition} />,
    document.body
  );
}
