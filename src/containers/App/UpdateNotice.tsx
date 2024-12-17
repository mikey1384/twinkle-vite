import React from 'react';
import { Color } from '~/constants/css';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const glitter = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

export default function UpdateNotice({
  updateDetail
}: {
  updateDetail: string;
}) {
  return (
    <div
      className={css`
        position: fixed;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 100000;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
      `}
    >
      <div
        className={css`
          background: #fff;
          width: 90%;
          max-width: 550px;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25),
            0 0 30px ${Color.gold(0.2)};
          overflow: hidden;
          position: relative;
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            animation: ${shimmer} 5s infinite linear;
            pointer-events: none;
          }
        `}
      >
        <div
          className={css`
            background: ${Color.gold(0.9)};
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
          `}
        >
          <Icon
            icon="exclamation-triangle"
            style={{ fontSize: '2rem', color: '#fff' }}
          />
          <h2
            className={css`
              color: #fff;
              margin: 0;
              font-size: 1.5rem;
              font-weight: 600;
            `}
          >
            Important Update Required
          </h2>
        </div>
        <div
          className={css`
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 1) 0%,
              rgba(255, 250, 240, 1) 100%
            );
          `}
        >
          <p
            className={css`
              font-size: 1.1rem;
              margin: 0;
              color: ${Color.darkerGray()};
              line-height: 1.5;
            `}
          >
            To ensure all features work properly, you must update to the latest
            version.
          </p>
          <div
            className={css`
              background: ${Color.highlightGray()};
              border-left: 4px solid ${Color.gold()};
              padding: 1.5rem;
              border-radius: 0.5rem;
            `}
          >
            <p
              className={css`
                margin: 0;
                color: ${Color.darkerGray()};
                font-size: 1.25rem;
                line-height: 1.6;
              `}
            >
              {updateDetail || 'Please press the button below to update.'}
            </p>
          </div>
          <div
            className={css`
              display: flex;
              justify-content: center;
              margin-top: 1rem;
            `}
          >
            <button
              className={css`
                background: linear-gradient(
                  90deg,
                  ${Color.gold()} 0%,
                  ${Color.gold(0.85)} 50%,
                  ${Color.gold()} 100%
                );
                background-size: 200% auto;
                color: #000;
                font-size: 1.2rem;
                padding: 1rem 3rem;
                font-weight: 600;
                border-radius: 2rem;
                cursor: pointer;
                position: relative;
                overflow: hidden;

                &::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: -100%;
                  width: 200%;
                  height: 100%;
                  background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.4) 50%,
                    transparent 100%
                  );
                  animation: ${shimmer} 10s infinite linear;
                  pointer-events: none;
                }

                &::after {
                  content: '';
                  position: absolute;
                  top: -50%;
                  left: -50%;
                  width: 200%;
                  height: 200%;
                  background: radial-gradient(
                    circle,
                    rgba(255, 255, 255, 0.2) 0%,
                    transparent 50%
                  );
                  animation: ${glitter} 7s infinite ease-in-out;
                  pointer-events: none;
                }

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2),
                    0 0 20px ${Color.gold(0.3)}, 0 0 40px ${Color.gold(0.2)};
                  background-position: right center;
                }
                transition: all 0.3s ease;
              `}
              onClick={() => window.location.reload()}
            >
              <Icon icon="sparkles" style={{ marginRight: '0.5rem' }} />
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
