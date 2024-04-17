import React from 'react';
import { useContentState } from '~/helpers/hooks';
import { css } from '@emotion/css';

const mainContainerStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Helvetica', sans-serif;
  color: #333;
  padding: 2rem;
`;

const articleContentStyle = css`
  background-color: #f5f5dc;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2rem;
  margin-bottom: 2rem;
  max-width: 800px;
  width: 100%;

  p {
    font-size: 1.5rem;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
  }
`;

const actionButtonsStyle = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
`;

const buttonStyle = css`
  background-color: #6c8eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.8rem 1.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #4c6ed9;
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
    <div className={mainContainerStyle}>
      <div className={articleContentStyle}>
        <p>{content || contentFetchedFromContext}</p>
      </div>
      <div className={actionButtonsStyle}>
        <button
          className={buttonStyle}
          onClick={() => onSetSelectedSection('rewrite')}
        >
          Rewrite
        </button>
        <button
          className={buttonStyle}
          onClick={() => onSetSelectedSection('upgrade')}
        >
          Upgrade AI Cards
        </button>
      </div>
    </div>
  );
}
