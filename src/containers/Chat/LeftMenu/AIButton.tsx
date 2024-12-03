import React from 'react';
import ciel from '~/assets/ciel.png';
import zero from '~/assets/zero.png';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function AIButton({
  aiName,
  loading,
  onClick
}: {
  aiName: string;
  loading: boolean;
  onClick: () => void;
}) {
  const src = aiName === 'ciel' ? ciel : zero;
  const alt = aiName === 'ciel' ? 'Ciel' : 'Zero';

  return (
    <button
      className={css`
        border: none;
        cursor: pointer;
        opacity: ${loading ? 0.5 : 1};
        background: none;
        padding: 0;
        transition: all 0.2s;

        &:hover {
          transform: translateY(2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
        }
      `}
      onClick={onClick}
      disabled={loading}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        `}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          fetchPriority="low"
          className={css`
            width: 100%;
            height: 100%;
            object-fit: cover;
          `}
        />
        {loading && (
          <div
            className={css`
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: rgba(255, 255, 255, 0.7);
            `}
          >
            <Icon icon="spinner" pulse style={{ color: Color.black() }} />
          </div>
        )}
      </div>
    </button>
  );
}
