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
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <div
        className="label"
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
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
