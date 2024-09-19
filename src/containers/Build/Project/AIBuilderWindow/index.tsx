import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSpring, animated } from 'react-spring';
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
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const chatSectionSpring = useSpring({
    width: isMenuExpanded ? '20%' : '80%',
    config: { tension: 300, friction: 30 }
  });

  const menuSectionSpring = useSpring({
    width: isMenuExpanded ? '80%' : '20%',
    config: { tension: 300, friction: 30 }
  });

  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition}>
      <div
        className={css`
          display: flex;
          height: 100%;
          overflow-x: hidden;
        `}
      >
        <animated.div style={chatSectionSpring}>
          <ChatSection chatMessages={chatMessages} />
        </animated.div>
        <animated.div
          style={menuSectionSpring}
          onMouseEnter={() => setIsMenuExpanded(true)}
          onMouseLeave={() => setIsMenuExpanded(false)}
        >
          <MenuSection />
        </animated.div>
      </div>
    </Window>,
    document.body
  );
}
