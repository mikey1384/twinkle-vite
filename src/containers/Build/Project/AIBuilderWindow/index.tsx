import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';
import ChatSection from './ChatSection';
import MenuSection from './MenuSection';
import { css } from '@emotion/css';

interface AIBuilderWindowProps {
  initialPosition: { x: number; y: number };
  chatMessages: Array<{ role: string; content: string }>;
}

export default function AIBuilderWindow({
  initialPosition,
  chatMessages
}: AIBuilderWindowProps) {
  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition}>
      <div
        className={css`
          display: flex;
          height: 100%;
        `}
      >
        <ChatSection chatMessages={chatMessages} />
        <MenuSection />
      </div>
    </Window>,
    document.body
  );
}
