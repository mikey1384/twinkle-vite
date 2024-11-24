import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';

interface AICallWindowProps {
  initialPosition: { x: number; y: number };
}

export default function AICallWindow({ initialPosition }: AICallWindowProps) {
  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition}>
      <div>AI Call Window Content</div>
    </Window>,
    document.body
  );
}
