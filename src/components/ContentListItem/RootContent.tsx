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
  tabletMaxWidth,
  desktopMinWidth,
  borderRadius
} from '~/constants/css';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
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
  border-radius: ${borderRadius};

  .title {
    grid-area: title;
    font-weight: bold !important;
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
    @media (min-width: ${desktopMinWidth}) and (max-width: ${tabletMaxWidth}) {
      font-size: 1.1rem;
    }
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1rem;
    }
  }

  transition: border-color 0.18s ease;

  &.expandable {
    background: transparent;
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
  noTopBorderRadius,
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
  userId,
  itemSelectedColor,
  itemSelectedOpacity
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
  itemSelectedColor?: string;
  itemSelectedOpacity?: number;
  noTopBorderRadius?: boolean;
}) {
  const { cardVars } = useThemedCardVars({ role: 'sectionPanel' });
  // Use global UI border vars for consistency with ContentPanel

  const selectedBorder = useMemo(() => {
    if (!itemSelectedColor) return 'var(--ui-border-strong)';
    const colorFn = (Color as any)[itemSelectedColor];
    if (typeof colorFn === 'function') {
      const borderOpacity =
        itemSelectedOpacity !== undefined
          ? Math.min(1, itemSelectedOpacity + 0.1)
          : 0.32;
      return colorFn(borderOpacity);
    }
    return itemSelectedColor;
  }, [itemSelectedColor, itemSelectedOpacity]);

  const cardThemeCSS = css`
    border-radius: ${borderRadius};
    border: 1px solid var(--ui-border);
    background: #fff;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
    @media (max-width: ${mobileMaxWidth}) {
      border: none;
      border-radius: 0;
      box-shadow: none;
      &.selected {
        /* Ensure selection is visible on mobile where border is otherwise removed */
        border: 2px solid ${selectedBorder};
        box-shadow: inset 0 0 0 2px ${selectedBorder};
      }
    }
    @media (min-width: ${desktopMinWidth}) {
      &:hover {
        border-color: var(--ui-border-strong);
      }
    }
    &.selected {
      border-color: ${selectedBorder};
      border-width: 2px;
      box-shadow: inset 0 0 0 2px ${selectedBorder};
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
      style={{
        ...cardVars,
        ...(noTopBorderRadius
          ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
          : null)
      }}
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
