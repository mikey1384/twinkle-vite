import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { borderRadius, Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function FileDownload({
  src,
  fileName,
  fileType,
  theme
}: {
  src: string;
  fileName: string;
  fileType?: 'image' | 'audio' | 'video' | 'pdf' | 'text' | 'other' | string;
  theme?: string;
}) {
  const typeKey = useMemo(() => {
    switch (fileType) {
      case 'audio':
        return 'file-audio';
      case 'video':
        return 'file-video';
      case 'pdf':
        return 'file-pdf';
      case 'image':
        return 'file-image';
      case 'text':
        return 'file-alt';
      default:
        return 'file';
    }
  }, [fileType]);

  const { color: linkColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });

  return (
    <ErrorBoundary componentPath="Texts/RichText/Markdown/EmbeddedComponent/FileDownload">
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
            gap: '1rem'
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
            onClick={() => window.open(src, '_blank')}
          >
            <Icon
              className={css`
                font-size: 6rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 5rem;
                }
              `}
              icon={typeKey as any}
            />
          </div>
          <div
            style={{
              width: 1,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div
              className={css`
                height: auto;
              `}
            >
              <div
                style={{
                  width: '100%',
                  fontWeight: 'bold',
                  color: linkColor,
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
            </div>
            <div
              style={{
                fontWeight: 'bold',
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
              onClick={() => window.open(src, '_blank')}
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

