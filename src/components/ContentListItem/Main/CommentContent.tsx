import React, { memo, useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

function CommentContent({
  contentObj: {
    id: contentId,
    contentType,
    uploader,
    content,
    fileName = '',
    filePath,
    fileSize,
    thumbUrl
  },
  style
}: {
  contentObj: {
    id: number;
    contentType: string;
    uploader: {
      id: number;
      username: string;
      profilePicUrl?: string;
    };
    content?: string;
    story?: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    topic?: string;
    thumbUrl?: string;
  };
  style?: React.CSSProperties;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();
  const commentContentCSS = useMemo(() => {
    return css`
      border: 1px solid ${Color.borderGray()};
      background: #fff;
      margin-top: 0;
      transition: background 0.5s, border 0.5s;
      &:hover {
        border-color: ${Color.darkerBorderGray()};
        background: ${Color.highlightGray()};
      }
      @media (max-width: ${mobileMaxWidth}) {
        margin-top: -0.5rem;
        border-left: 0;
        border-right: 0;
      }
    `;
  }, []);

  return (
    <div
      style={{
        cursor: 'pointer',
        borderRadius,
        ...style
      }}
      className={commentContentCSS}
    >
      <div onClick={() => navigate(`/${contentType}s/${contentId}`)}>
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              fontSize: '1.5rem'
            }}
          >
            <div
              style={{
                width: '100%',
                paddingLeft: 0,
                paddingRight: 0
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    overflowWrap: 'break-word',
                    paddingRight: '1rem',
                    wordBreak: 'break-word'
                  }}
                >
                  <div style={{ width: '5rem' }}>
                    <ProfilePic
                      style={{ width: '100%' }}
                      userId={uploader.id}
                      profilePicUrl={uploader.profilePicUrl}
                    />
                  </div>
                  {uploader.username && (
                    <div
                      style={{ color: Color.darkGray(), fontWeight: 'bold' }}
                    >
                      by {uploader.username}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: '2rem',
                      width: '100%',
                      textAlign: 'left',
                      color: Color.black(),
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      WebkitLineClamp: 15
                    }}
                  >
                    {filePath && (
                      <div>
                        {userId ? (
                          <div style={{ width: '100%', maxHeight: '30vh' }}>
                            <ContentFileViewer
                              isThumb
                              contentId={contentId}
                              contentType="comment"
                              fileName={fileName}
                              filePath={filePath}
                              fileSize={Number(fileSize)}
                              thumbUrl={thumbUrl}
                              videoHeight="100%"
                              thumbHeight="100%"
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                                height: 'auto',
                                maxHeight: '25vh',
                                overflow: 'hidden',
                                marginBottom: '1rem'
                              }}
                            />
                          </div>
                        ) : (
                          <LoginToViewContent />
                        )}
                      </div>
                    )}
                    <div
                      className={css`
                        width: 100%;
                        text-align: left;
                        color: ${Color.black()};
                        white-space: pre-wrap;
                        overflow-wrap: break-word;
                        word-break: break-word;
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 10;
                        -webkit-box-orient: vertical;
                        @media (max-width: ${mobileMaxWidth}) {
                          line-height: 1.4;
                        }
                      `}
                    >
                      {content}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CommentContent);
