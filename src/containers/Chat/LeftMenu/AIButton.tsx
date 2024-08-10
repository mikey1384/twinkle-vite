import React from 'react';
import ciel from '~/assets/ciel.png';
import zero from '~/assets/zero.png';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';

export default function AIButton({
  aiName,
  loading,
  onClick,
  alt
}: {
  aiName: string;
  loading: boolean;
  onClick: () => void;
  alt: string;
}) {
  const aiSrc = aiName === 'ciel' ? ciel : zero;
  return (
    <button
      className={css`
        border: none;
        cursor: pointer;
        opacity: ${loading ? 0.5 : 1};
        background: none;
        padding: 0;
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
        `}
      >
        <img
          src={aiSrc}
          alt={alt}
          className={css`
            width: 100%;
            height: 100%;
            background-size: cover;
            border-radius: 4px;
          `}
        />
        {loading && (
          <Icon
            icon="spinner"
            pulse
            className={css`
              position: absolute;
            `}
          />
        )}
      </div>
    </button>
  );
}
