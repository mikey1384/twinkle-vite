import React, { useRef } from 'react';
import { css, keyframes } from '@emotion/css';
import { useSpring, animated } from 'react-spring';
import { useOutsideClick } from '~/helpers/hooks'; // Added import

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

interface ProjectMenuProps {
  onClose: () => void;
  mode: 'load' | 'new';
  onSelectNewProject?: () => void;
}

export default function ProjectMenu({
  onClose,
  mode,
  onSelectNewProject
}: ProjectMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(menuRef, onClose);

  const menuSpring = useSpring({
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0%)' },
    config: { tension: 220, friction: 20 }
  });

  const projects = ['Starcraft', 'Facebook', 'World of Warcraft'];
  const newProjectOptions = ['App', 'Game'];

  const handleOptionClick = (project: string) => {
    if (mode === 'load') {
      console.log('load', project);
    } else if (mode === 'new') {
      console.log('new', project);
      onSelectNewProject?.();
    }
    onClose();
  };

  return (
    <animated.div
      ref={menuRef}
      style={menuSpring}
      className={css`
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100%;
        background: ${mode === 'load'
          ? 'linear-gradient(45deg, #2196f3, #1976d2)'
          : 'linear-gradient(45deg, #fb8c00, #ef6c00)'};
        animation: ${gradientAnimation} 15s ease infinite;
        box-shadow: -2px 0 15px rgba(0, 0, 0, 0.3);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
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
        {mode === 'load' ? 'Load Project' : 'New Project'}
      </h2>
      <ul
        className={css`
          flex-grow: 1;
          overflow-y: auto;
          list-style: none;
          padding: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: center;
        `}
      >
        {mode === 'load' ? (
          projects.length > 0 ? (
            projects.map((project) => (
              <li
                key={project}
                className={css`
                  width: 100%;
                  margin: 1rem 0;
                  padding: 1.2rem 1.5rem;
                  background: rgba(255, 255, 255, 0.2);
                  border-radius: 12px;
                  cursor: pointer;
                  transition: background 0.3s ease, transform 0.3s ease,
                    box-shadow 0.3s ease;
                  font-size: 1.6rem;
                  font-weight: 600;
                  color: #ffffff;
                  text-align: center;

                  &:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-3px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                  }
                `}
                onClick={() => handleOptionClick(project)}
              >
                {project}
              </li>
            ))
          ) : (
            <li
              className={css`
                text-align: center;
                color: #ffffff;
                font-size: 1.6rem;
              `}
            >
              No projects to load
            </li>
          )
        ) : (
          newProjectOptions.map((option) => (
            <li
              key={option}
              className={css`
                width: 100%;
                margin: 1rem 0;
                padding: 1.2rem 1.5rem;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.3s ease, transform 0.3s ease,
                  box-shadow 0.3s ease;
                font-size: 1.6rem;
                font-weight: 600;
                color: #ffffff;
                text-align: center;

                &:hover {
                  background: rgba(255, 255, 255, 0.3);
                  transform: translateY(-3px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
              `}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </li>
          ))
        )}
      </ul>
    </animated.div>
  );
}
