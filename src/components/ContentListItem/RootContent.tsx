import React, { useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import ContentFileViewer from '~/components/ContentFileViewer';
import Thumbnail from './Thumbnail';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const rootContentCSS = css`
  display: grid;
  height: 100%;
  grid-template-columns: 4fr minmax(min-content, 1fr);
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    'title thumb'
    'description thumb'
    'reward reward';
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
    position: relative;
    height: 100%;
    grid-area: thumb;
    display: flex;
    justify-content: end;
    align-items: start;
    > img {
      max-height: 100%;
      object-fit: contain;
    }
  }

  .description {
    grid-area: description;
    color: ${Color.black()};
    transition: color 1s;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    display: -moz-box;
    -moz-box-orient: vertical;
    display: box;
    box-orient: vertical;
    -webkit-line-clamp: 3;
    -moz-line-clamp: 3;
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

  &.no-thumb {
    grid-template-columns: 1fr;
    grid-template-areas:
      'title'
      'description'
      'reward';
  }

  &.no-reward {
    grid-template-columns: 4fr minmax(min-content, 1.5fr);
    grid-template-areas:
      'title thumb'
      'description thumb'
      'description thumb';
    &.no-thumb {
      grid-template-columns: 1fr;
      grid-template-areas:
        'title'
        'description'
        'description';
    }
  }

  &.no-reward .description {
    -webkit-line-clamp: 5;
    -moz-line-clamp: 5;
    line-clamp: 5;
  }

  &.is-video {
    grid-template-columns: minmax(min-content, 1fr) 1fr 1fr 1fr 1fr 1fr;
    grid-template-areas:
      'thumb thumb title title title title'
      'thumb thumb description description description description'
      'thumb thumb description description description description';
    .thumb {
      justify-content: start;
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-template-areas:
      'title title title title title thumb thumb'
      'description description description description description thumb thumb'
      'reward reward reward reward reward reward reward';
    &.no-reward {
      grid-template-columns: 6fr 3fr;
      grid-template-areas:
        'title thumb'
        'description thumb'
        'description thumb';
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
  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileName || ''),
    [fileName]
  );
  const boxShadowColor = useMemo(() => {
    return selected ? Color[itemSelectedColor](itemSelectedOpacity) : '';
  }, [selected, itemSelectedColor, itemSelectedOpacity]);
  const isRewardBarShown = useMemo(() => {
    return !!rewardLevel && contentType === 'subject';
  }, [contentType, rewardLevel]);
  const hasThumb = useMemo(() => {
    return (
      (contentType === 'subject' && rootId) ||
      (filePath && userId) ||
      contentType === 'video'
    );
  }, [contentType, filePath, rootId, userId]);

  return (
    <div
      onClick={handleClick}
      style={{
        boxShadow: selected ? `0 0 5px ${boxShadowColor}` : ''
      }}
      className={`${rootContentCSS} ${
        contentType === 'video' ? 'is-video' : ''
      }${isRewardBarShown ? '' : ' no-reward'}${hasThumb ? '' : ' no-thumb'}${
        expandable ? ' expandable' : ''
      }${selected ? ' selected' : ''}${
        hideSideBordersOnMobile ? ' hideSideBordersOnMobile' : ''
      }`}
    >
      <ContentDetails
        contentType={contentType}
        description={description}
        story={story}
        topic={topic}
        title={title}
        uploader={uploader}
        contentId={contentId}
      />
      {contentType === 'video' && (
        <VideoThumbnail
          className="thumb"
          content={content}
          contentId={contentId}
          rewardLevel={rewardLevel}
        />
      )}
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
              className="thumb"
              imageOnly
              noLink
              contentId={rootId}
              defaultThumbUrl={rootContent?.thumbUrl || '/img/link.png'}
            />
          )}
        </>
      )}
      {filePath && userId && (
        <>
          {fileType === 'image' || (fileType === 'video' && thumbUrl) ? (
            <Thumbnail
              className="thumb"
              contentType={contentType}
              filePath={filePath}
              fileName={fileName}
              thumbUrl={thumbUrl}
            />
          ) : (
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
            />
          )}
        </>
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
