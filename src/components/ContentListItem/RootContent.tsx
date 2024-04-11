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
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'title title title title thumb'
    'description description description description thumb'
    'reward reward reward reward reward';
  align-items: start;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${borderRadius};

  .title {
    grid-area: title;
    font-weight: bold;
    font-size: 2.2rem;
    margin-bottom: 0.5rem;

    > p {
      margin: 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      display: -moz-box;
      -moz-box-orient: vertical;
      -moz-line-clamp: 1;
      display: box;
      box-orient: vertical;
      line-clamp: 1;
      text-overflow: ellipsis;
    }
    > small {
      font-size: 1.3rem;
      display: block;
      margin-top: 0;
      line-height: 1.3;
    }
  }

  .thumb {
    grid-area: thumb;
    justify-self: end;
    align-self: start;
    margin-top: 0.5rem;
    max-width: 100%;
    max-height: 100%;
  }

  .description {
    grid-area: description;
    color: ${Color.black()};
    transition: color 1s;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    display: -moz-box;
    -moz-box-orient: vertical;
    -moz-line-clamp: 3;
    display: box;
    box-orient: vertical;
    line-clamp: 3;
    text-overflow: ellipsis;
  }

  .reward-bar {
    grid-area: reward;
    font-size: 1.3rem;
    margin-left: CALC(-1rem - 1px);
    margin-right: CALC(-1rem - 1px);
    align-self: end;
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

  &.no-reward {
    --grid-template-areas: 'title title title title thumb'
      'description description description description thumb';
    .description {
      -webkit-line-clamp: 5;
      -moz-line-clamp: 5;
      line-clamp: 5;
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      'title title title thumb'
      'description description description thumb'
      'reward reward reward reward';

    &.no-reward {
      --grid-template-areas: 'title title title thumb'
        'description description description thumb';
      .description {
        -webkit-line-clamp: 5;
        -moz-line-clamp: 5;
        line-clamp: 5;
      }
    }

    &.hideSideBordersOnMobile {
      border-left: none;
      border-right: none;
    }

    .title {
      font-size: 1.8rem;
      margin-bottom: 0.3rem;

      > small {
        font-size: 1.1rem;
      }
    }

    .thumb {
      justify-self: center;
      margin-top: 0.5rem;
    }

    .reward-bar {
      font-size: 1rem;
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
  const isRewardBarShown = useMemo(() => {
    return !!rewardLevel && contentType === 'subject';
  }, [contentType, rewardLevel]);

  return (
    <div
      onClick={handleClick}
      style={{
        boxShadow: selected ? `0 0 5px ${boxShadowColor}` : ''
      }}
      className={`${rootContentCSS} ${isRewardBarShown ? '' : 'no-reward'} ${
        expandable ? 'expandable' : ''
      } ${selected ? 'selected' : ''} ${
        hideSideBordersOnMobile ? 'hideSideBordersOnMobile' : ''
      }`}
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
              className="thumb"
              rewardLevel={rootRewardLevel}
              videoId={rootId}
              height="60%"
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
          className="thumb"
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
      {isRewardBarShown && (
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
