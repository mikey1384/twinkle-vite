import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import ContentFileViewer from '~/components/ContentFileViewer';
import LoginToViewContent from '~/components/LoginToViewContent';
import SecretComment from '~/components/SecretComment';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useNavigate } from 'react-router-dom';
import { useContentState } from '~/helpers/hooks';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useContentContext } from '~/contexts';
import { css } from '@emotion/css';

ActivityItem.propTypes = {
  post: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function ActivityItem({
  post,
  style
}: {
  post: any;
  style: React.CSSProperties;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const navigate = useNavigate();
  const {
    contentId,
    content,
    filePath,
    fileName,
    fileSize,
    timeStamp,
    thumbUrl,
    secretAnswer,
    secretAttachment,
    subjectId,
    subjectUploaderId
  } = post;

  const subjectState = useContentState({
    contentType: 'subject',
    contentId: subjectId
  });

  useEffect(() => {
    if (
      userId &&
      (secretAnswer || secretAttachment) &&
      subjectId &&
      subjectState.prevSecretViewerId !== userId
    ) {
      handleCheckSecretShown();
    }
    if (!userId) {
      onChangeSpoilerStatus({
        shown: false,
        subjectId
      });
    }

    async function handleCheckSecretShown() {
      const { responded } = await checkIfUserResponded(subjectId);
      onChangeSpoilerStatus({
        shown: responded,
        subjectId,
        prevSecretViewerId: userId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, subjectState?.prevSecretViewerId, userId]);

  const timeSincePost = useMemo(() => timeSince(timeStamp), [timeStamp]);

  const isHidden = useMemo(() => {
    const secretShown =
      subjectState.secretShown || subjectUploaderId === userId;
    return (secretAnswer || secretAttachment) && !secretShown;
  }, [
    secretAnswer,
    secretAttachment,
    subjectState.secretShown,
    subjectUploaderId,
    userId
  ]);

  return (
    <div
      style={{
        cursor: 'pointer',
        borderRadius,
        ...style
      }}
      className={css`
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
        }
      `}
    >
      <div
        onClick={() =>
          navigate(
            `/${post.type === 'url' ? 'link' : post.type}s/${post.contentId}`
          )
        }
      >
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              display: 'flex',
              width: '100%'
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
                  <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
                    {post.subjectTitle}
                  </p>
                  <span
                    className={css`
                      font-size: 1rem;
                      color: ${Color.gray()};
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 0.8rem;
                      }
                    `}
                  >
                    {timeSincePost}
                  </span>
                  {isHidden ? (
                    <SecretComment style={{ marginTop: '1.7rem' }} />
                  ) : (
                    <div
                      style={{
                        fontSize: '1.5rem',
                        marginTop: '1.7rem',
                        width: '100%',
                        textAlign: 'left',
                        color: Color.black(),
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        WebkitLineClamp: 7
                      }}
                    >
                      {filePath && (
                        <div>
                          {userId ? (
                            <div style={{ width: '100%' }}>
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
                      <div>{content}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
