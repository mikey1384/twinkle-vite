import React from 'react';
import PropTypes from 'prop-types';
import Embedly from '~/components/Embedly';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ContentDetails.propTypes = {
  contentType: PropTypes.string.isRequired,
  description: PropTypes.string,
  title: PropTypes.string,
  uploader: PropTypes.object,
  contentId: PropTypes.number
};

export default function ContentDetails({
  contentType,
  description,
  title,
  uploader,
  contentId
}) {
  return (
    <div
      style={{
        width:
          contentType !== 'subject' && contentType !== 'url' ? '75%' : '100%',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: 0,
        paddingRight: 0,
        ...(contentType === 'url' ? { paddingTop: '0.5rem' } : {})
      }}
    >
      {contentType === 'video' && (
        <>
          <div style={{ marginLeft: '1rem' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
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
      )}
      {contentType === 'subject' && (
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
      )}
      {contentType === 'url' && (
        <div>
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '2rem'
            }}
            className="label"
          >
            {title}
          </span>
          <Embedly
            small
            noLink
            style={{ marginTop: '0.5rem' }}
            contentId={contentId}
          />
        </div>
      )}
    </div>
  );
}
