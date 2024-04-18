import React from 'react';
import { useContentState } from '~/helpers/hooks';
import { borderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const buttonStyle = css`
  background-color: #6c8eff;
  color: #fff;
  border: none;
  border-radius: ${borderRadius};
  padding: 0.8rem 1.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #4c6ed9;
  }
`;

const upgradeButtonStyle = css`
  ${buttonStyle};
  font-weight: bold;
  background-color: #ffc700;

  &:hover {
    background-color: #ffb000;
  }
`;

export default function Main({
  contentId,
  contentType,
  content,
  onSetSelectedSection
}: {
  contentId?: number;
  contentType?: string;
  content?: string;
  onSetSelectedSection: (section: string) => void;
}) {
  const { content: contentFetchedFromContext } = useContentState({
    contentId: contentId as number,
    contentType: contentType as string
  });

  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Helvetica', sans-serif;
        color: #333;
        padding: 2rem;
      `}
    >
      <div
        className={css`
          display: flex;
          justify-content: center;
          gap: 1rem;
          width: 100%;
          max-width: 800px;
        `}
      >
        <button
          className={buttonStyle}
          onClick={() => onSetSelectedSection('rewrite')}
        >
          Rewrite
        </button>
        <button
          className={upgradeButtonStyle}
          onClick={() => onSetSelectedSection('upgrade')}
        >
          Upgrade AI Cards
        </button>
      </div>
      <div
        className={css`
          background-color: #f5f5dc;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 2rem;
          margin-top: 2rem;
          max-width: 500px;
          width: 100%;

          p {
            font-size: 1.5rem;
            line-height: 1.6;
            color: #333;
            white-space: pre-wrap;
            overflow-wrap: break-word;
            word-break: break-word;
          }
        `}
      >
        <p>{content || contentFetchedFromContext}</p>
      </div>
    </div>
  );
}
