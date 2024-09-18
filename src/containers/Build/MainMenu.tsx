import React, { useState } from 'react';
import { css, keyframes, cx } from '@emotion/css';
import { useSpring, animated } from 'react-spring';
import Icon from '~/components/Icon';
import ProjectMenu from './ProjectMenu';
import { useBuildContext } from '~/contexts';

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

interface MainMenuProps {
  onOptionSelect: (option: string) => void;
  onCreateNewProject: (projectType: string) => void;
}

export default function MainMenu({
  onOptionSelect,
  onCreateNewProject
}: MainMenuProps) {
  const isProjectLoaded = useBuildContext(
    (value: any) => value.state.isProjectLoaded
  );

  const titleSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay: 200,
    config: { tension: 120, friction: 14 }
  });

  const buttonsSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay: 400,
    config: { tension: 120, friction: 14 }
  });

  const [isProjectMenuOpen, setProjectMenuOpen] = useState(false);
  const [isNewProjectMenuOpen, setNewProjectMenuOpen] = useState(false);

  // Base button style
  const baseButtonStyle = css`
    width: 280px;
    padding: 1.2rem 2rem;
    margin: 1rem 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: #ffffff;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;

    &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.98);
    }

    &:focus {
      outline: 2px solid #ffffff;
      outline-offset: 4px;
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      transform: skewX(-45deg);
      transition: all 0.5s ease;
    }

    &:hover::before {
      left: 150%;
    }

    & > svg {
      margin-right: 10px;
    }

    @media (max-width: 768px) {
      width: 220px;
      font-size: 1.2rem;
      padding: 1rem 1.5rem;
    }

    @media (max-width: 480px) {
      width: 180px;
      font-size: 1rem;
      padding: 0.8rem 1.2rem;
    }
  `;

  // Styles for specific buttons
  const newProjectButtonStyle = css`
    background: linear-gradient(45deg, #fb8c00, #ef6c00);
    box-shadow: 0 10px 20px rgba(251, 140, 0, 0.4);

    &:hover {
      box-shadow: 0 15px 25px rgba(251, 140, 0, 0.6);
    }

    &:active {
      box-shadow: 0 8px 15px rgba(251, 140, 0, 0.4);
    }
  `;

  const loadProjectButtonStyle = css`
    background: linear-gradient(45deg, #2196f3, #1976d2);
    box-shadow: 0 10px 20px rgba(33, 150, 243, 0.4);

    &:hover {
      box-shadow: 0 15px 25px rgba(33, 150, 243, 0.6);
    }

    &:active {
      box-shadow: 0 8px 15px rgba(33, 150, 243, 0.4);
    }
  `;

  const resumeProjectButtonStyle = css`
    background: linear-gradient(45deg, #4caf50, #388e3c);
    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.4);

    &:hover {
      box-shadow: 0 15px 25px rgba(76, 175, 80, 0.6);
    }

    &:active {
      box-shadow: 0 8px 15px rgba(76, 175, 80, 0.4);
    }
  `;

  return (
    <div
      className={css`
        position: relative;
        background: linear-gradient(-45deg, #ffb74d, #4fc3f7, #ff8a65, #81c784);
        background-size: 400% 400%;
        animation: ${gradientAnimation} 15s ease infinite;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        color: #ffffff;
        font-family: 'Montserrat', sans-serif;
      `}
    >
      <div
        className={css`
          position: relative;
          transform: translateY(-20px);
          z-index: 2;
        `}
      >
        <animated.h1
          style={titleSpring}
          className={css`
            font-size: 4.5rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-align: center;
            margin-bottom: 3rem;
            text-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);

            @media (max-width: 768px) {
              font-size: 3rem;
            }

            @media (max-width: 480px) {
              font-size: 2.5rem;
            }
          `}
        >
          Build with AI
        </animated.h1>
        <animated.div
          style={buttonsSpring}
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
          `}
        >
          <button
            onClick={() => handleButtonClick('new')}
            className={cx(baseButtonStyle, newProjectButtonStyle)}
            aria-label="Start a new project"
          >
            <Icon icon="plus" />
            Start New Project
          </button>
          <button
            onClick={() => handleButtonClick('load')}
            className={cx(baseButtonStyle, loadProjectButtonStyle)}
            aria-label="Load an existing project"
          >
            <Icon icon="folder" />
            Load Project
          </button>
          {isProjectLoaded && (
            <button
              onClick={() => handleButtonClick('resume')}
              className={cx(baseButtonStyle, resumeProjectButtonStyle)}
              aria-label="Resume the project"
            >
              <Icon icon="play" />
              Resume Project
            </button>
          )}
        </animated.div>
      </div>
      <div
        className={css`
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(76, 175, 80, 0.6);
          z-index: 1;
        `}
      ></div>
      {isProjectMenuOpen && (
        <ProjectMenu mode="load" onClose={() => setProjectMenuOpen(false)} />
      )}
      {isNewProjectMenuOpen && (
        <ProjectMenu
          mode="new"
          onSelectNewProject={onCreateNewProject}
          onClose={() => setNewProjectMenuOpen(false)}
        />
      )}
    </div>
  );

  function handleButtonClick(option: string) {
    if (option === 'load') {
      setProjectMenuOpen(true);
      setNewProjectMenuOpen(false);
    } else if (option === 'new') {
      setNewProjectMenuOpen(true);
      setProjectMenuOpen(false);
    } else if (option === 'resume') {
      onOptionSelect('resume');
    } else {
      onOptionSelect(option);
    }
  }
}
