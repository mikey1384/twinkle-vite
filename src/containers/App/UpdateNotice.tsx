import React from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

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
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          overflow: hidden;
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
                background: ${Color.gold()};
                font-size: 1.2rem;
                padding: 1rem 3rem;
                font-weight: 600;
                border-radius: 2rem;
                cursor: pointer;
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                transition: all 0.2s ease;
              `}
              onClick={() => window.location.reload()}
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
