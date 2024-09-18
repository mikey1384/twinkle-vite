import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';

interface AIBuilderWindowProps {
  initialPosition: { x: number; y: number };
  onSendMessage: (message: string) => void;
  children: React.ReactNode;
}

export default function AIBuilderWindow({
  initialPosition,
  onSendMessage,
  children
}: AIBuilderWindowProps) {
  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition} onSendMessage={onSendMessage}>
      {children}
    </Window>,
    document.body
  );
}
