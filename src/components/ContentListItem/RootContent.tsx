import React, { useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import ContentFileViewer from '~/components/ContentFileViewer';
import Thumbnail from '../Thumbnail';
import VideoThumbnail from './VideoThumbnail';
import ContentDetails from './ContentDetails';
import Icon from '~/components/Icon';
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

function setAlphaExact(rgba: string, a: number) {
  const m = rgba.match(
    /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
  );
  if (!m) return rgba;
  const [_, r, g, b] = m;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}

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

  &.is-build {
    position: relative;
    min-height: 17rem;
    grid-template-columns: minmax(0, 1fr) minmax(22rem, 34%);
    grid-template-rows: 1fr;
    grid-template-areas: 'buildDetails thumb';
    align-items: stretch;
    align-content: start;
    gap: 0.9rem 1.5rem;
    padding: 1.25rem;
    overflow: hidden;
    border-color: var(--build-card-border, rgba(71, 126, 235, 0.32));
    background: var(--build-card-bg, #fff);
    box-shadow: none;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0.45rem;
      background: var(--build-card-accent, ${Color.logoBlue()});
    }
    .build-details {
      grid-area: buildDetails;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 0.75rem;
      min-width: 0;
    }
    .title {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      margin-bottom: 0;
      > p {
        font-size: 2.45rem;
        line-height: 1.14;
        max-height: 5.7rem;
        -webkit-line-clamp: 2;
        -moz-line-clamp: 2;
        line-clamp: 2;
      }
      > small {
        color: ${Color.darkGray(0.68)};
        font-size: 1.25rem;
        font-weight: 700;
      }
    }
    .build-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      align-self: flex-start;
      padding: 0.45rem 0.8rem;
      border: 1px solid ${Color.logoBlue(0.2)};
      border-radius: 999px;
      background: ${Color.logoBlue(0.12)};
      color: ${Color.logoBlue()};
      font-size: 1.15rem;
      font-weight: 800;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .description {
      position: relative;
      z-index: 1;
      align-self: start;
      color: ${Color.darkGray(0.88)};
      font-size: 1.22rem;
      line-height: 1.5;
      -webkit-line-clamp: 3;
      -moz-line-clamp: 3;
      line-clamp: 3;
    }
    .build-card-action {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      align-self: start;
      justify-self: start;
      min-height: 3.4rem;
      padding: 0.7rem 1rem;
      border-radius: 0.8rem;
      background: var(--build-card-accent, ${Color.logoBlue()});
      color: #fff;
      font-size: 1.25rem;
      font-weight: 800;
    }
    .thumb.build-thumb {
      justify-content: stretch;
      align-items: stretch;
      min-height: 14rem;
      border: 1px solid var(--build-card-border, rgba(20, 35, 60, 0.14));
      border-radius: 0.9rem;
      overflow: hidden;
      background: #101828;
      > img {
        width: 100%;
        height: 100%;
        max-height: none;
        object-fit: cover;
      }
    }
    .build-thumb-toolbar {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 0.36rem;
      height: 1.8rem;
      padding: 0 0.7rem;
      background: rgba(255, 255, 255, 0.88);
      span {
        width: 0.48rem;
        height: 0.48rem;
        border-radius: 50%;
        background: rgba(50, 65, 90, 0.42);
      }
    }
    .build-thumb-label {
      position: absolute;
      right: 0.75rem;
      bottom: 0.75rem;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.7rem;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.72);
      color: #fff;
      font-size: 1.05rem;
      font-weight: 800;
    }
    &.no-thumb {
      grid-template-columns: 1fr;
      grid-template-areas: 'buildDetails';
    }
    &.selected {
      box-shadow: none;
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
    &.is-build {
      min-height: 10.5rem;
      grid-template-columns: minmax(0, 1fr) minmax(8.25rem, 38%);
      grid-template-areas: 'buildDetails thumb';
      gap: 0.75rem;
      padding: 0.9rem 1rem;
      &::before {
        display: none;
      }
      .build-details {
        gap: 0.5rem;
      }
      .title > p {
        font-size: 1.55rem;
        line-height: 1.16;
        max-height: 3.6rem;
      }
      .title > small {
        font-size: 0.95rem;
      }
      .build-badge {
        gap: 0.35rem;
        padding: 0.32rem 0.55rem;
        font-size: 0.82rem;
      }
      .description {
        font-size: 0.9rem;
        line-height: 1.35;
        -webkit-line-clamp: 2;
        -moz-line-clamp: 2;
        line-clamp: 2;
      }
      .build-card-action {
        min-height: 2.35rem;
        padding: 0.45rem 0.7rem;
        border-radius: 0.65rem;
        font-size: 0.95rem;
      }
      .thumb.build-thumb {
        min-height: 8.5rem;
        border-radius: 0.7rem;
      }
      .build-thumb-toolbar {
        height: 1.35rem;
        padding: 0 0.5rem;
        gap: 0.25rem;
        span {
          width: 0.36rem;
          height: 0.36rem;
        }
      }
      .build-thumb-label {
        right: 0.5rem;
        bottom: 0.5rem;
        gap: 0.3rem;
        padding: 0.34rem 0.5rem;
        font-size: 0.82rem;
      }
      &.no-thumb {
        grid-template-areas: 'buildDetails';
      }
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
  question,
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
  question?: string;
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
  uploader: { id: number; username: string; profileTheme?: string | null };
  userId?: number;
  itemSelectedColor?: string;
  itemSelectedOpacity?: number;
  noTopBorderRadius?: boolean;
}) {
  const { cardVars } = useThemedCardVars({ role: 'sectionPanel' });
  const {
    accentColor: buildAccentColor,
    borderColor: buildBorderColor
  } = useThemedCardVars({
    role: 'sectionPanel',
    themeName: uploader?.profileTheme || undefined
  });
  // Use global UI border vars for consistency with ContentPanel

  const buildCardVars = useMemo(
    () =>
      ({
        ['--build-card-accent' as const]: buildAccentColor,
        ['--build-card-border' as const]: buildBorderColor,
        ['--build-card-tint' as const]: setAlphaExact(buildAccentColor, 0.1),
        ['--build-card-bg' as const]: '#fff'
      } as React.CSSProperties),
    [buildAccentColor, buildBorderColor]
  );

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
    &.is-build.selected {
      box-shadow: none;
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
      (contentType === 'build' && thumbUrl) ||
      contentType === 'video'
    );
  }, [contentType, filePath, rootId, thumbUrl, userId]);

  return (
    <div
      onClick={handleClick}
      className={`${rootContentCSS} ${cardThemeCSS} ${
        selected ? 'selected ' : ''
      }${contentType === 'video' ? 'is-video' : ''}${
        contentType === 'build' ? ' is-build' : ''
      }${
        isRewardBarShown ? '' : ' no-reward'
      }${hasThumb ? '' : ' no-thumb'}${
        hideSideBordersOnMobile ? ' hideSideBordersOnMobile' : ''
      }`}
      style={{
        ...cardVars,
        ...(contentType === 'build' ? buildCardVars : null),
        ...(noTopBorderRadius
          ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
          : null)
      }}
    >
      <ContentDetails
        isListening={isListening}
        contentType={contentType}
        description={description}
        question={question}
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
      {contentType === 'build' && thumbUrl && (
        <div className="thumb build-thumb">
          <div className="build-thumb-toolbar">
            <span />
            <span />
            <span />
          </div>
          <img src={thumbUrl} alt={title || 'Lumine App'} />
          <div className="build-thumb-label">
            <Icon icon="external-link-alt" />
            <span>Live app</span>
          </div>
        </div>
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
            : contentType === 'dailyReflection'
              ? 'daily-reflection'
              : contentType === 'build'
                ? 'app'
              : contentType
      }${contentType === 'build' ? '' : 's'}/${contentId}`
    );
  }
}
