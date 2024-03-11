import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import {
  borderRadius,
  Color,
  desktopMinWidth,
  mobileMaxWidth
} from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { renderFileSize } from '~/helpers/stringHelpers';

export default function FileInfo({
  fileName,
  fileType,
  fileSize,
  src,
  theme
}: {
  fileName: string;
  fileType: string;
  fileSize: number;
  src: string;
  theme?: string;
}) {
  const {
    link: { color: linkColor }
  } = useTheme(theme);

  const displayedFileSize = useMemo(() => renderFileSize(fileSize), [fileSize]);
  return (
    <ErrorBoundary componentPath="Chat/Message/MessageBody/FileAttachment/FileInfo">
      <div
        style={{
          width: '100%',
          height: '100%',
          background: Color.wellGray(),
          padding: '1rem',
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
              icon={
                fileType === 'other' || fileType === 'image'
                  ? 'file'
                  : `file-${fileType}`
              }
            />
          </div>
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
        </div>
      </div>
    </ErrorBoundary>
  );
}
