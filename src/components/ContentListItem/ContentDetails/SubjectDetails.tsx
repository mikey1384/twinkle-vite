import React from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { User } from '~/types';

SubjectDetails.propTypes = {
  description: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  uploader: PropTypes.object.isRequired
};
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
        width: '100%'
      }}
    >
      <div
        className={`label ${css`
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          overflow-wrap: break-word;
          word-break: break-word;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2rem;
          }
        `}`}
      >
        {title}
      </div>
      {uploader.username && (
        <div style={{ color: Color.gray() }}>Posted by {uploader.username}</div>
      )}
      {description && (
        <div
          className={css`
            margin-top: 1rem;
            width: 100%;
            text-align: left;
            color: ${Color.darkerGray()};
            white-space: pre-wrap;
            overflow-wrap: break-word;
            word-break: break-word;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 0.9rem;
              line-height: 1.4;
            }
          `}
        >
          {description}
        </div>
      )}
    </div>
  );
}
