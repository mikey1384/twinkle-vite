import React from 'react';
import { css } from '@emotion/css';
import { useSpring, animated } from 'react-spring';

interface MainMenuProps {
  onOptionSelect: (option: string) => void;
}

export default function MainMenu({ onOptionSelect }: MainMenuProps) {
  const titleSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    delay: 200
  });

  const buttonsSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay: 500
  });

  return (
    <div
      className={css`
        @keyframes gradientAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        background: linear-gradient(-45deg, #ff9a9e, #fad0c4, #fad0c4, #ff9a9e);
        background-size: 400% 400%;
        animation: gradientAnimation 15s ease infinite;
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      `}
    >
      <animated.h1
        style={titleSpring}
        className={css`
          font-size: 4rem;
          color: #ffffff;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          margin-bottom: 2rem;
        `}
      >
        {`Build with AI`}
      </animated.h1>
      <animated.div
        style={buttonsSpring}
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        <button onClick={() => onOptionSelect('new')} className={buttonStyle}>
          Start New Project
        </button>
        <button onClick={() => onOptionSelect('load')} className={buttonStyle}>
          Load Project
        </button>
      </animated.div>
    </div>
  );
}

const buttonStyle = css`
  padding: 1rem 2rem;
  margin: 1rem 0;
  font-size: 1.5rem;
  color: #ffffff;
  background: linear-gradient(45deg, #6b6bff, #6a94f9);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;
