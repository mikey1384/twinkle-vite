import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';

interface DraggableWindowProps {
  initialPosition: { x: number; y: number };
  onSendMessage: (message: string) => void;
  children: React.ReactNode;
}

export default function DraggableWindow({
  initialPosition,
  onSendMessage,
  children
}: DraggableWindowProps) {
  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition} onSendMessage={onSendMessage}>
      {children}
    </Window>,
    document.body
  );
}
