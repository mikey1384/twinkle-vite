import React, { useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function RootContent({
  content,
  contentType,
  contentId,
  description,
  expandable,
  fileName,
  filePath,
  fileSize,
  hideSideBordersOnMobile,
  itemSelectedColor,
  itemSelectedOpacity,
  modalOverModal,
  navigate,
  onClick,
  rewardLevel,
  rootContent,
  rootContentCSS,
  rootRewardLevel,
  rootId,
  rootType,
  selected,
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
  hideSideBordersOnMobile?: boolean;
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
  const boxShadowColor = useMemo(() => {
    return selected ? Color[itemSelectedColor](itemSelectedOpacity) : '';
  }, [selected, itemSelectedColor, itemSelectedOpacity]);

  return (
    <div
      onClick={handleClick}
      style={{
        boxShadow: selected ? `0 0 5px ${boxShadowColor}` : ''
      }}
      className={`${rootContentCSS} ${expandable ? 'expandable' : ''} ${
        selected ? 'selected' : ''
      } ${hideSideBordersOnMobile ? 'hideSideBordersOnMobile' : ''}`}
    >
      {contentType === 'video' && (
        <VideoThumbnail
          content={content}
          contentId={contentId}
          rewardLevel={rewardLevel}
          height={deviceIsMobile ? '75%' : '50%'}
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
        <>
          {rootType === 'video' && (
            <VideoThumbImage
              rewardLevel={rootRewardLevel}
              videoId={rootId}
              height="50%"
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
        </>
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
      {!!rewardLevel && contentType === 'subject' && (
        <div className="reward-bar">
          <RewardLevelBar
            style={{ fontSize: '1.3rem' }}
            rewardLevel={rewardLevel}
          />
        </div>
      )}
    </div>
  );

  function handleClick() {
    if (onClick) {
      return onClick();
    }
    if (expandable || selectable) return;
    navigate(
      `/${
        contentType === 'url'
          ? 'link'
          : contentType === 'aiStory'
          ? 'ai-storie'
          : contentType
      }s/${contentId}`
    );
  }
}
