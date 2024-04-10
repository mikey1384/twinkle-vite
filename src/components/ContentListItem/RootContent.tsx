import React, { useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

const rootContentCSS = css`
  height: 100%;
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    'title thumb'
    'description description'
    'reward reward';
  align-items: center;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${borderRadius};

  .title {
    grid-area: title;
    font-weight: bold;
    font-size: 2.2rem;
  }

  .description {
    grid-area: description;
    color: ${Color.black()};
    transition: color 1s;
  }

  .reward-bar {
    grid-area: reward;
    font-size: 1.3rem;
  }

  transition: background 0.5s, border 0.5s;

  &:hover {
    .title {
      color: ${Color.black()};
    }
  }

  &.expandable {
    background: ${Color.whiteGray()};
  }

  &.selected {
    border: 0.5rem solid var(--border-color);
    &:hover {
      border-color: var(--border-color);
    }
  }

  &:not(.selected) {
    border: 1px solid ${Color.borderGray()};
    &:hover {
      border-color: ${Color.darkerBorderGray()};
      background: ${Color.highlightGray()};
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    &.hideSideBordersOnMobile {
      border-left: none;
      border-right: none;
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    margin-top: -0.5rem;
    .posted,
    .reward-bar {
      font-size: 1rem;
    }
    .title {
      font-size: 1.8rem;
    }
  }
`;

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
