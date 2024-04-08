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
        width: '100%',
        height: '100%'
      }}
    >
      <div
        className={css`
          font-weight: bold;
          margin-bottom: 0.5rem;
          overflow-wrap: break-word;
          word-break: break-word;
          font-size: 2.2rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {title}
      </div>
      {uploader.username && (
        <small style={{ color: Color.gray() }}>
          Posted by {uploader.username}
        </small>
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
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 0.9rem;
              line-height: 1.3;
            }
          `}
        >
          {description}
        </div>
      )}
    </div>
  );
}
