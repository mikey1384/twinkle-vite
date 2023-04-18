import React, { memo, useEffect } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import SecretAnswer from '~/components/SecretAnswer';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import { useNavigate } from 'react-router-dom';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';

interface Props {
  onClick?: () => void;
  contentObj: {
    id: number;
    contentType: string;
    notFound?: boolean;
  };
  expandable?: boolean;
  modalOverModal?: boolean;
  onContentIsDeleted?: (contentId: number) => void;
  selectable?: boolean;
  selected?: boolean;
  style?: any;
  innerStyle?: any;
}
function ContentListItem({
  onClick = () => {},
  contentObj,
  contentObj: { id: contentId, contentType, notFound },
  expandable,
  modalOverModal,
  onContentIsDeleted,
  selectable,
  selected,
  style,
  innerStyle
}: Props) {
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
    story,
    topic,
    title,
    thumbUrl,
    uploader = {}
  } = useContentState({ contentId, contentType });
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  useEffect(() => {
    if (!loaded) {
      onInitContent({ contentId, ...contentObj });
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
              minHeight: contentType === 'subject' ? '10rem' : '',
              ...innerStyle
            }}
          >
            {contentType === 'video' && (
              <VideoThumbnail
                content={content}
                contentId={contentId}
                rewardLevel={rewardLevel}
              />
            )}
            <ContentDetails
              contentType={contentType}
              description={description}
              story={story}
              topic={topic}
              title={title}
              uploader={uploader}
              contentId={contentId}
            />
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
              paddingBottom: !!rewardLevel ? '1rem' : ''
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
