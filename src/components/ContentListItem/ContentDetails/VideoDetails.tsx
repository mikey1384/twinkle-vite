import React from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { User } from '~/types';

VideoDetails.propTypes = {
  description: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  uploader: PropTypes.object.isRequired
};
export default function VideoDetails({
  description,
  title,
  uploader
}: {
  description: string;
  title: string;
  uploader: User;
}) {
  return (
    <>
      <div style={{ marginLeft: '1rem' }}>
        <div
          style={{
            lineHeight: 1.5,
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
          className="label"
        >
          {title}
        </div>
        <div style={{ color: Color.gray() }}>
          Uploaded by {uploader.username}
        </div>
      </div>
      <div
        style={{
          marginTop: '1rem',
          marginLeft: '1rem',
          color: Color.darkerGray(),
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {description}
      </div>
    </>
  );
}
