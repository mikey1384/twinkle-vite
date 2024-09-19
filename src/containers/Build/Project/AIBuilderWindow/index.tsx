import React, { useState, useCallback } from 'react';
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
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);

  const chatSectionSpring = useSpring({
    width: isMenuExpanded ? '20%' : '80%',
    config: { tension: 300, friction: 30 }
  });

  const menuSectionSpring = useSpring({
    width: isMenuExpanded ? '80%' : '20%',
    config: { tension: 300, friction: 30 }
  });

  const handleWindowEnter = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.chat-section')) {
      setIsMenuExpanded(false);
    } else if (target.closest('.menu-section')) {
      setIsMenuExpanded(true);
    }
  }, []);

  const handleWindowLeave = useCallback(() => {
    setIsMenuExpanded(true);
  }, []);

  const handleChatSectionEnter = useCallback(() => {
    setIsMenuExpanded(false);
  }, []);

  const handleMenuSectionEnter = useCallback(() => {
    setIsMenuExpanded(true);
  }, []);

  return ReactDOM.createPortal(
    <Window
      initialPosition={initialPosition}
      onMouseLeave={handleWindowLeave}
      onMouseEnter={handleWindowEnter}
    >
      <div
        className={css`
          display: flex;
          height: 100%;
          overflow-x: hidden;
        `}
      >
        <animated.div
          style={chatSectionSpring}
          className="chat-section"
          onMouseEnter={handleChatSectionEnter}
        >
          <ChatSection chatMessages={chatMessages} />
        </animated.div>
        <animated.div
          style={menuSectionSpring}
          className="menu-section"
          onMouseEnter={handleMenuSectionEnter}
        >
          <MenuSection isMenuExpanded={isMenuExpanded} />
        </animated.div>
      </div>
    </Window>,
    document.body
  );
}
