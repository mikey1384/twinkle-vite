import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import {
  borderRadius,
  Color,
  desktopMinWidth,
  mobileMaxWidth
} from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { returnTheme } from '~/helpers';
import { renderFileSize } from '~/helpers/stringHelpers';

FileInfo.propTypes = {
  fileName: PropTypes.string.isRequired,
  fileType: PropTypes.string.isRequired,
  fileSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isThumb: PropTypes.bool,
  src: PropTypes.string.isRequired,
  theme: PropTypes.string
};
export default function FileInfo({
  fileName,
  fileType,
  fileSize,
  isThumb,
  src,
  theme
}: {
  fileName: string;
  fileType: string;
  fileSize: number | string;
  isThumb?: boolean;
  src: string;
  theme?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const {
    link: { color: linkColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const displayedFileSize = useMemo(
    () => renderFileSize(Number(fileSize)),
    [fileSize]
  );
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: !isThumb ? Color.wellGray() : '',
        padding: !isThumb ? '1rem' : '',
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
          className={
            isThumb
              ? ''
              : css`
                  color: ${Color.black()};
                  cursor: pointer;
                  &:hover {
                    color: #000;
                  }
                `
          }
          onClick={() => (isThumb ? {} : window.open(src))}
        >
          <Icon
            className={css`
              font-size: 8rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 7rem;
              }
            `}
            icon={fileType === 'other' ? 'file' : `file-${fileType}`}
          />
        </div>
        {!isThumb && (
          <div
            style={{
              width: 1,
              flexGrow: 1,
              marginLeft: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div
              className={css`
                height: 7rem;
                @media (max-width: ${mobileMaxWidth}) {
                  height: 6rem;
                }
              `}
              style={{
                width: '100%'
              }}
            >
              <div
                style={{
                  width: '100%',
                  fontWeight: 'bold',
                  color: Color[linkColor](),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  whiteSpace: 'nowrap'
                }}
              >
                <a
                  className={css`
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.5rem;
                    }
                  `}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {fileName}
                </a>
              </div>
              <div
                className={css`
                  font-size: 1.2rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1rem;
                  }
                `}
              >
                {displayedFileSize}
              </div>
            </div>
            <div
              style={{
                fontWeight: 'bold',
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
              onClick={() => window.open(src)}
            >
              <span
                className={css`
                  cursor: pointer;
                  color: ${Color.black()};
                  &:hover {
                    color: #000;
                    @media (min-width: ${desktopMinWidth}) {
                      text-decoration: underline;
                    }
                  }
                  line-height: 1;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.3rem;
                  }
                `}
              >
                Download
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
