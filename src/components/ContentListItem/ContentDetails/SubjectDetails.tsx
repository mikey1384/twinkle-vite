import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { User } from '~/types';

const titleStyles = css`
  font-weight: bold;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  font-size: 2.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.7rem;
  }
`;

const descriptionStyles = css`
  margin-top: 1rem;
  width: 100%;
  flex-grow: 1;
  text-align: left;
  color: ${Color.darkerGray()};
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
    line-height: 1.3;
  }
`;

export default function SubjectDetails({
  description,
  title,
  uploader
}: {
  description: string;
  title: string;
  uploader: User;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      }}
    >
      <div className={titleStyles}>{title}</div>
      {uploader.username && (
        <small style={{ color: Color.gray() }}>
          Posted by {uploader.username}
        </small>
      )}
      {description && <div className={descriptionStyles}>{description}</div>}
    </div>
  );
}
