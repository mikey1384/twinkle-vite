import React from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbnail from '../VideoThumbnail';
import ContentDetails from '../ContentDetails';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Container({
  content,
  contentType,
  contentId,
  description,
  expandable,
  fileName,
  filePath,
  fileSize,
  innerStyle,
  modalOverModal,
  navigate,
  onClick,
  rewardLevel,
  rootContent,
  rootContentCSS,
  rootRewardLevel,
  rootId,
  rootType,
  selectable,
  story,
  thumbUrl,
  title,
  topic,
  uploader,
  userId
}: {
  content: string;
  contentType: string;
  contentId: number;
  description: string;
  expandable?: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  innerStyle?: React.CSSProperties;
  itemSelectedColor: string;
  itemSelectedOpacity: number;
  modalOverModal?: boolean;
  navigate: (path: string) => void;
  onClick?: () => void;
  rewardLevel: number;
  rootContent?: any;
  rootRewardLevel?: number;
  rootId?: number;
  rootType?: string;
  rootContentCSS: string;
  selected?: boolean;
  selectable?: boolean;
  story?: string;
  thumbUrl?: string;
  title: string;
  topic?: string;
  uploader: { id: number; username: string };
  userId?: number;
}) {
  return (
    <div
      onClick={onClick}
      className={rootContentCSS}
      style={{ width: '100%', height: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%'
        }}
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
            className={css`
              display: flex;
              width: 100%;
              font-size: 1.5rem;
              max-height: 70%;
              min-height: ${contentType === 'subject' ? '10rem' : ''};
            `}
            style={innerStyle}
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
            {contentType === 'subject' && rootId && (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  width: 25%;
                  max-height: 70%;
                `}
              >
                {rootType === 'video' && (
                  <VideoThumbImage
                    rewardLevel={rootRewardLevel}
                    videoId={rootId}
                    src={`https://img.youtube.com/vi/${rootContent?.content}/mqdefault.jpg`}
                  />
                )}
                {rootType === 'url' && (
                  <Embedly
                    imageOnly
                    noLink
                    contentId={rootId}
                    defaultThumbUrl={rootContent?.thumbUrl || '/img/link.png'}
                  />
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
        </div>
        {!!rewardLevel && contentType === 'subject' && (
          <div
            className={css`
              margin-bottom: 1rem;
              margin-right: -1px;
              margin-left: -1px;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0px;
                margin-right: 0px;
              }
            `}
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
