import React from 'react';
import { useContentState } from '~/helpers/hooks';
import { css } from '@emotion/css';

const mainContainerStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  font-family: 'Helvetica', sans-serif;
  color: #333;
`;

const articleContentStyle = css`
  background-color: #f0f8ff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  margin-bottom: 2rem;
  max-width: 800px;
  width: 100%;

  p {
    font-size: 1.5rem;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
  }
`;

const actionButtonsStyle = css`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
`;

const buttonStyle = css`
  background-color: #4267b2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #3b5998;
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
