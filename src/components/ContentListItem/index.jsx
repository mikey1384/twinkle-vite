import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import SecretAnswer from '~/components/SecretAnswer';
import Loading from '~/components/Loading';
import ContentFileViewer from '~/components/ContentFileViewer';
import { useNavigate } from 'react-router-dom';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';

ContentListItem.propTypes = {
  contentObj: PropTypes.object.isRequired,
  expandable: PropTypes.bool,
  modalOverModal: PropTypes.bool,
  onClick: PropTypes.func,
  onContentIsDeleted: PropTypes.func,
  selectable: PropTypes.bool,
  selected: PropTypes.bool,
  style: PropTypes.object
};

function ContentListItem({
  onClick = () => {},
  contentObj,
  contentObj: { id: contentId, contentType, notFound },
  expandable,
  modalOverModal,
  onContentIsDeleted,
  selectable,
  selected,
  style
}) {
  const navigate = useNavigate();
  const { userId } = useKeyContext((v) => v.myState);
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const {
    content,
    description,
    isDeleted,
    fileName,
    filePath,
    fileSize,
    loaded,
    rewardLevel,
    rootObj,
    secretAnswer,
    secretAttachment,
    title,
    thumbUrl,
    uploader = {}
  } = useContentState({ contentId, contentType });
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  useEffect(() => {
    if (!loaded) {
      onInitContent({ contentId, contentType, ...contentObj });
    }
    if (rootObj) {
      onInitContent({
        contentId: rootObj.id,
        contentType: rootObj.contentType,
        ...rootObj
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (isDeleted) {
      onContentIsDeleted?.(contentId);
    }
  }, [contentId, isDeleted, onContentIsDeleted]);

  return !!notFound || !!isDeleted ? null : (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius,
        boxShadow: selected
          ? `0 0 5px ${Color[itemSelectedColor](itemSelectedOpacity)}`
          : null,
        border: selected
          ? `0.5rem solid ${Color[itemSelectedColor](itemSelectedOpacity)}`
          : null,
        ...style
      }}
      className={css`
        border: 1px solid ${Color.borderGray()};
        background: ${expandable ? Color.whiteGray() : '#fff'};
        .label {
          color: ${Color.black()};
          transition: color 1s;
        }
        margin-top: ${expandable ? '-1rem' : '0'};
        transition: background 0.5s, border 0.5s;
        &:hover {
          border-color: ${Color.darkerBorderGray()};
          .label {
            color: ${Color.black()};
          }
          background: ${expandable ? '#fff' : Color.highlightGray()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: -0.5rem;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <div
        onClick={
          expandable || selectable
            ? () => {}
            : () =>
                navigate(
                  `/${
                    contentType === 'url' ? 'link' : contentType
                  }s/${contentId}`
                )
        }
      >
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              fontSize: '1.3rem',
              minHeight: contentType === 'subject' ? '10rem' : ''
            }}
          >
            {contentType === 'video' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '25%'
                }}
              >
                {content ? (
                  <VideoThumbImage
                    rewardLevel={rewardLevel}
                    videoId={contentId}
                    src={`https://img.youtube.com/vi/${content}/mqdefault.jpg`}
                  />
                ) : (
                  <Loading style={{ height: '10rem' }} />
                )}
              </div>
            )}
            <div
              style={{
                width:
                  contentType !== 'subject' && contentType !== 'url'
                    ? '75%'
                    : '100%',
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
            {contentType === 'subject' && rootObj?.id && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '25%',
                  marginBottom: secretAnswer ? '1rem' : ''
                }}
              >
                {rootObj?.contentType === 'video' && (
                  <VideoThumbImage
                    rewardLevel={rootObj.rewardLevel}
                    videoId={rootObj.id}
                    src={`https://img.youtube.com/vi/${rootObj.content}/mqdefault.jpg`}
                  />
                )}
                {rootObj?.contentType === 'url' && (
                  <Embedly imageOnly noLink contentId={rootObj?.id} />
                )}
              </div>
            )}
            {filePath && userId && (
              <ContentFileViewer
                contentId={contentId}
                contentType={contentType}
                fileName={fileName}
                filePath={filePath}
                fileSize={fileSize}
                modalOverModal={modalOverModal}
                thumbUrl={thumbUrl}
                videoHeight="100%"
                isThumb
                style={{
                  display: 'flex',
                  width: '15rem',
                  height: '11rem'
                }}
              />
            )}
          </div>
          {contentType === 'subject' && (secretAnswer || secretAttachment) && (
            <SecretAnswer
              style={{ marginTop: filePath && userId ? '0.5rem' : 0 }}
              answer={secretAnswer}
              subjectId={contentId}
              uploaderId={uploader.id}
              attachment={secretAttachment}
              modalOverModal={modalOverModal}
              mediaDisabled
            />
          )}
        </div>
        {!!rewardLevel && contentType === 'subject' && (
          <div
            className={css`
              margin-right: -1px;
              margin-left: -1px;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0px;
                margin-right: 0px;
              }
            `}
            style={{
              paddingBottom: !!rewardLevel && '1rem'
            }}
          >
            <RewardLevelBar
              style={{ fontSize: '1.3rem' }}
              rewardLevel={rewardLevel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ContentListItem);
