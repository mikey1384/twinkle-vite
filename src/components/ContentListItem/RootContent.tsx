import React, { useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import ContentFileViewer from '~/components/ContentFileViewer';
import Thumbnail from '../Thumbnail';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import {
  Color,
  mobileMaxWidth,
  desktopMinWidth,
  wideBorderRadius
} from '~/constants/css';
import { useThemeTokens } from '~/theme/useThemeTokens';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';

const rootContentCSS = css`
  display: grid;
  height: 100%;
  background: #fff;
  grid-template-columns: 4fr minmax(min-content, 1fr);
  grid-template-rows: 2fr 2fr 1fr;
  grid-template-areas:
    'title thumb'
    'description thumb'
    'reward reward';
  align-items: start;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${wideBorderRadius};

  .title {
    grid-area: title;
    font-weight: bold;
    margin-bottom: 0.5rem;
    > p {
      font-size: 2.2rem;
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
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      line-height: 1.5;
      max-height: 3.3rem;
      @media (max-width: ${mobileMaxWidth}) {
        font-size: 1.8rem;
        max-height: 2.7rem;
      }
    }
    > small {
      font-size: 1.3rem;
      display: block;
      margin-top: 0;
      line-height: 1.3;
      @media (max-width: ${mobileMaxWidth}) {
        font-size: 1.1rem;
      }
    }

    @media (max-width: ${mobileMaxWidth}) {
      margin-bottom: 0.3rem;
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
    font-size: 1.1rem;
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
    word-wrap: break-word;
    text-overflow: ellipsis;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1rem;
    }
  }

  .reward-bar {
    grid-area: reward;
    font-size: 1.3rem;
    margin-left: 0;
    margin-right: 0;
    align-self: start;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1rem;
    }
  }

  transition: background 0.5s, border 0.5s;

  border: 1px solid var(--ui-border-weak);

  &.expandable {
    background: ${Color.whiteGray()};
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
    grid-template-columns: 2fr 1fr;
    grid-template-areas:
      'title thumb'
      'description thumb'
      'reward reward';
    &.no-reward {
      grid-template-columns: 6fr 3fr;
      grid-template-areas:
        'title thumb'
        'description thumb'
        'description thumb';
    }
    &.is-video {
      grid-template-columns: 2fr 3fr;
      grid-template-rows: 1fr 2fr;
      grid-template-areas:
        'thumb title'
        'thumb description'
        'thumb description';
    }
    &.hideSideBordersOnMobile {
      border-left: none;
      border-right: none;
    }
  }
  @media (min-width: ${desktopMinWidth}) {
    &:hover {
      .title {
        color: ${Color.black()};
      }
    }
  }
`;

export default function RootContent({
  actualTitle,
  actualDescription,
  content,
  contentType,
  contentId,
  description,
  fileName,
  filePath,
  fileSize,
  hideSideBordersOnMobile,
  isListening,
  navigate,
  onClick,
  rewardLevel,
  rootContent,
  rootRewardLevel,
  rootId,
  rootType,
  selected,
  selectable,
  siteUrl,
  story,
  thumbUrl,
  title,
  topic,
  uploader,
  userId
}: {
  actualTitle?: string;
  actualDescription?: string;
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
  isListening?: boolean;
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
  siteUrl?: string;
  story?: string;
  thumbUrl?: string;
  title: string;
  topic?: string;
  uploader: { id: number; username: string };
  userId?: number;
}) {
  const { themeName } = useThemeTokens();
  const { getColor: getFilterColor } = useRoleColor('filter', {
    themeName,
    fallback: 'logoBlue'
  });

  const hoverBg = getFilterColor(0.1) || Color.logoBlue(0.1);
  const activeBg = getFilterColor(0.18) || Color.logoBlue(0.18);
  const hoverBorder = getFilterColor(0.28) || Color.logoBlue(0.28);
  const activeBorder = getFilterColor(0.4) || Color.logoBlue(0.4);

  const cardThemeCSS = css`
    border-radius: ${wideBorderRadius};
    border: 1px solid var(--ui-border-weak);
    background: #fff;
    @media (min-width: ${desktopMinWidth}) {
      &:hover {
        background: ${hoverBg};
        border-color: ${hoverBorder};
      }
    }
    &.selected {
      background: ${activeBg};
      border-color: ${activeBorder};
    }
  `;

  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileName || ''),
    [fileName]
  );

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
      className={`${rootContentCSS} ${cardThemeCSS} ${
        selected ? 'selected ' : ''
      }${contentType === 'video' ? 'is-video' : ''}${
        isRewardBarShown ? '' : ' no-reward'
      }${hasThumb ? '' : ' no-thumb'}${
        hideSideBordersOnMobile ? ' hideSideBordersOnMobile' : ''
      }`}
    >
      <ContentDetails
        isListening={isListening}
        contentType={contentType}
        description={description}
        story={story}
        topic={topic}
        title={title}
        uploader={uploader}
        contentId={contentId}
        thumbUrl={thumbUrl}
        actualTitle={actualTitle}
        actualDescription={actualDescription}
        siteUrl={siteUrl}
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
              noPaddingBottom
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
    if (selectable) return;
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
