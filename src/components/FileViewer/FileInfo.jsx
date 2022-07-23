import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { renderFileSize } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

FileInfo.propTypes = {
  fileType: PropTypes.string.isRequired,
  fileName: PropTypes.string,
  fileSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  src: PropTypes.string.isRequired
};

export default function FileInfo({ src, fileType, fileName, fileSize }) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const displayedFileSize = useMemo(() => renderFileSize(fileSize), [fileSize]);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <div
          className={css`
            color: ${Color.black()};
            cursor: pointer;
            &:hover {
              color: #000;
            }
          `}
          onClick={() => window.open(src)}
        >
          <Icon
            className={css`
              font-size: 10rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 7rem;
              }
            `}
            icon={fileType === 'other' ? 'file' : `file-${fileType}`}
          />
          <div
            className={css`
              color: ${Color[linkColor]()};
              margin-top: 0.5rem;
              width: 100%;
              text-align: center;
              font-size: 1.3rem;
              font-weight: bold;
              overflow: hidden;
              display: -webkit-box;
              webkit-line-clamp: 2;
              webkit-box-orient: vertical;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            {fileName}
          </div>
          {displayedFileSize && (
            <div
              className={css`
                margin-top: 0.5rem;
                text-align: center;
                width: 100%;
                font-size: 1.2rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1rem;
                }
              `}
            >
              {displayedFileSize}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
