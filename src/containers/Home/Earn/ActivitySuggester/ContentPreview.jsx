import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ContentPreview.propTypes = {
  contentObj: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function ContentPreview({
  contentObj: {
    id: contentId,
    contentType,
    uploader,
    content,
    fileName,
    filePath,
    fileSize,
    thumbUrl
  },
  style
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();

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
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <div
        onClick={() =>
          navigate(
            `/${
              contentType === 'aiStory' ? 'ai-storie' : contentType
            }s/${contentId}`
          )
        }
      >
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
