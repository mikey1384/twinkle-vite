import React, { memo, useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import SecretAnswer from '~/components/SecretAnswer';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

function RootContent({
  content,
  contentId,
  contentType,
  description,
  fileName,
  filePath,
  fileSize,
  onClick,
  rootType,
  expandable,
  hideSideBordersOnMobile,
  itemSelectedColor,
  itemSelectedOpacity,
  modalOverModal,
  navigate,
  rewardLevel,
  rootObj,
  secretAnswer,
  secretAttachment,
  selected,
  selectable,
  story,
  style,
  innerStyle,
  thumbUrl,
  title,
  topic,
  uploader,
  userId
}: {
  content: any;
  contentId: number;
  contentType: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  onClick: () => void;
  rootType?: string;
  expandable?: boolean;
  hideSideBordersOnMobile?: boolean;
  selected?: boolean;
  itemSelectedColor: string;
  itemSelectedOpacity: number;
  modalOverModal?: boolean;
  navigate: (path: string) => void;
  rewardLevel: number;
  rootObj?: {
    id: number;
    contentType: string;
    content: string;
    rewardLevel: number;
  };
  secretAnswer: string;
  secretAttachment: string;
  selectable?: boolean;
  story: string;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  title: string;
  thumbUrl: string;
  topic: string;
  uploader: { id: number; username: string };
  userId?: number;
}) {
  const boxShadowColor = useMemo(() => {
    return selected ? Color[itemSelectedColor](itemSelectedOpacity) : '';
  }, [selected, itemSelectedColor, itemSelectedOpacity]);
  const borderColor = useMemo(() => {
    return selected ? Color[itemSelectedColor](itemSelectedOpacity) : '';
  }, [selected, itemSelectedColor, itemSelectedOpacity]);
  const backgroundColor = useMemo(() => {
    return expandable ? Color.whiteGray() : '#fff';
  }, [expandable]);

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius,
        boxShadow: selected ? `0 0 5px ${boxShadowColor}` : '',
        border: selected ? `0.5rem solid ${borderColor}` : '',
        ...style
      }}
      className={css`
        border: 1px solid ${Color.borderGray()};
        background: ${backgroundColor};
        .label {
          font-size: 2.2rem;
          font-weight: bold;
          color: ${Color.black()};
          transition: color 1s;
        }
        small {
          line-height: 0.7;
          margin-bottom: 0.7rem;
          font-size: 1.3rem;
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
          ${hideSideBordersOnMobile
            ? 'border-left: none; border-right: none;'
            : ''}
          small {
            font-size: 1rem;
          }
          .label {
            font-size: 1.8rem;
          }
        }
      `}
    >
      <div
        onClick={
          expandable || selectable
            ? () => null
            : () =>
                navigate(
                  `/${
                    contentType === 'url'
                      ? 'link'
                      : contentType === 'aiStory'
                      ? 'ai-storie'
                      : contentType
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
              style={{
                marginTop:
                  (filePath && userId) || rootType === 'url' ? '0.5rem' : 0
              }}
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
              paddingBottom: rewardLevel ? '1rem' : ''
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

export default memo(RootContent);
