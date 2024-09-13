import React from 'react';
import { css, keyframes } from '@emotion/css';
import { useSpring, animated } from 'react-spring';

interface ProjectMenuProps {
  onClose: () => void;
}

function ProjectMenu({ onClose }: ProjectMenuProps) {
  const menuSpring = useSpring({
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0%)' },
    config: { tension: 220, friction: 20 }
  });

  const projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];

  return (
    <animated.div
      style={menuSpring}
      className={css`
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100%;
        background: linear-gradient(-45deg, #ffb74d, #4fc3f7, #ff8a65, #81c784);
        background-size: 400% 400%;
        animation: ${gradientAnimation} 15s ease infinite;
        box-shadow: -2px 0 15px rgba(0, 0, 0, 0.3); // Enhanced shadow for better visibility
        padding: 2rem;
        display: flex;
        flex-direction: column;
        z-index: 10;
        color: #ffffff;
        font-family: 'Montserrat', sans-serif;
      `}
    >
      <h2
        className={css`
          margin-bottom: 1.5rem;
          text-align: center;
        `}
      >
        Load Project
      </h2>
      <ul
        className={css`
          flex-grow: 1;
          overflow-y: auto; // Added for scroll if content exceeds height
        `}
      >
        {projects.map((project) => (
          <li
            key={project}
            className={css`
              margin: 1rem 0;
              padding: 0.8rem 1.2rem;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.3s ease;

              &:hover {
                background: rgba(255, 255, 255, 0.3);
              }
            `}
            onClick={() => {
              /* Handle project load */
            }}
          >
            {project}
          </li>
        ))}
      </ul>
      <button
        onClick={onClose}
        className={css`
          padding: 0.7rem 1.5rem;
          background: #ffffff;
          color: #2196f3;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          transition: background 0.3s ease, color 0.3s ease;

          &:hover {
            background: #2196f3;
            color: #ffffff;
          }
        `}
      >
        Close
      </button>
    </animated.div>
  );
}

export default ProjectMenu;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;
