import React from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

SubjectDetails.propTypes = {
  description: PropTypes.string,
  title: PropTypes.string,
  uploader: PropTypes.object
};

export default function SubjectDetails({ description, title, uploader }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%'
      }}
    >
      <div
        className="label"
        style={{
          width: '100%',
          overflowWrap: 'break-word',
          paddingRight: '1rem',
          wordBreak: 'break-word'
        }}
      >
        <div
          className={css`
            line-clamp: 2;
            font-size: 2.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2rem;
              line-height: 1.4;
            }
          `}
        >
          {title}
        </div>
        {uploader.username && (
          <div style={{ color: Color.gray() }}>
            Posted by {uploader.username}
          </div>
        )}
        {description && (
          <div
            style={{
              marginTop: '1rem',
              width: '100%',
              textAlign: 'left',
              color: Color.darkerGray(),
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
