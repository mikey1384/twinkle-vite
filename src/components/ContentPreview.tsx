import React, { useCallback, useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { truncateTopic } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import {
  cardLevelHash,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { useRoleColor } from '~/theme/useRoleColor';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import { css } from '@emotion/css';

export default function ContentPreview({
  contentObj: {
    id: contentId,
    isListening = false,
    contentType,
    uploader,
    content = '',
    story,
    fileName = '',
    filePath,
    fileSize,
    topic,
    thumbUrl,
    title,
    difficulty
  },
  style,
  hideUploader
}: {
  contentObj: {
    id: number;
    isListening?: boolean;
    contentType: string;
    uploader: {
      id: number;
      username: string;
      profilePicUrl: string;
    };
    content?: string;
    story?: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    topic?: string;
    thumbUrl?: string;
    title?: string;
    difficulty?: number;
  };
  style?: React.CSSProperties;
  hideUploader?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const navigate = useNavigate();
  const { cardVars } = useThemedCardVars({ role: 'sectionPanel' });
  const filterRole = useRoleColor('filter', { fallback: 'logoBlue' });
  const isAIMessage =
    uploader?.id === Number(ZERO_TWINKLE_ID) ||
    uploader?.id === Number(CIEL_TWINKLE_ID);
  const aiVoice = uploader?.id === Number(CIEL_TWINKLE_ID) ? 'nova' : undefined;
  const formattedStoryTitle = useMemo(() => {
    const raw = title || topic || '';
    if (!raw) return '';
    const uppercaseSet = new Set(['AI', 'USA', 'UK', 'NASA', 'SAT', 'GRE']);
    const produced = raw
      .split(/\s+/)
      .map((word) => {
        if (!word) return word;
        const candidate = word.toUpperCase();
        if (uppercaseSet.has(candidate)) return candidate;
        const lower = word.toLowerCase();
        const match = lower.match(/[a-z]/i);
        if (!match || match.index === undefined) return word;
        const idx = match.index;
        return (
          lower.slice(0, idx) +
          lower.charAt(idx).toUpperCase() +
          lower.slice(idx + 1)
        );
      })
      .join(' ');
    return truncateTopic(produced);
  }, [title, topic]);

  const difficultyColor = useMemo(() => {
    const level =
      typeof difficulty === 'number' && difficulty > 0 ? difficulty : 1;
    const colorKey = cardLevelHash[level]?.color || 'logoBlue';
    const colorFn = Color[colorKey] || Color.logoBlue;
    return colorFn();
  }, [difficulty]);

  const listeningBadgeBg = useMemo(() => {
    if (filterRole.getColor) {
      const opacity = Math.min(
        (filterRole.defaultOpacity ?? 0.18) * 0.8 + 0.08,
        0.25
      );
      return filterRole.getColor(opacity);
    }
    return Color.logoBlue(0.12);
  }, [filterRole]);

  const listeningBadgeTextColor = useMemo(() => {
    return filterRole.color || Color.darkGray();
  }, [filterRole.color]);

  const containerClass = useMemo(
    () => css`
      border: 1px solid var(--ui-border);
      border-radius: ${borderRadius};
      background: #fff;
      padding: 1.6rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      transition: border-color 0.18s ease;
      cursor: pointer;
      @media (hover: hover) and (pointer: fine) {
        &:hover {
          border-color: var(--ui-border-strong);
        }
      }
      @media (max-width: ${mobileMaxWidth}) {
        border-left: 0;
        border-right: 0;
        border-radius: 0;
      }
    `,
    []
  );

  const headerClass = css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `;

  const metaClass = css`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    /* meta holds two rows: uploader row and optional topic row */
  `;

  const uploaderLabelClass = css`
    color: ${Color.darkGray()};
    font-size: 1.3rem;
    font-weight: 600;
  `;

  const uploaderRowClass = css`
    min-height: 3.8rem;
    display: flex;
    align-items: center;
  `;

  const storyTitleClass = css`
    font-size: 1.6rem;
    font-weight: 700;
    color: ${Color.darkGray()};
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  `;

  const topicLabelClass = css`
    color: ${Color.darkerGray()};
    font-size: 1.5rem;
  `;

  const listeningBadgeClass = css`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    font-size: 1.3rem;
    font-weight: 600;
    background: ${listeningBadgeBg};
    color: ${listeningBadgeTextColor};
  `;

  const difficultyChipClass = useMemo(
    () => css`
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      font-size: 1.2rem;
      font-weight: 600;
      color: #fff;
      background: ${difficultyColor};
      box-shadow: 0 6px 18px -14px ${difficultyColor};
    `,
    [difficultyColor]
  );

  const attachmentWrapperClass = css`
    width: 100%;
    max-height: 28rem;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  `;

  const previewContentClass = css`
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  `;

  const handleNavigate = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('a, button, video, audio')) return;
      navigate(
        `/${
          contentType === 'aiStory' ? 'ai-storie' : contentType
        }s/${contentId}`
      );
    },
    [contentId, contentType, navigate]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(
          `/${
            contentType === 'aiStory' ? 'ai-storie' : contentType
          }s/${contentId}`
        );
      }
    },
    [contentId, contentType, navigate]
  );

  const renderStoryContent = () => {
    if (!isListening) {
      return (
        <RichText
          isPreview
          maxLines={6}
          contentId={contentId}
          contentType={contentType}
          section="preview"
          style={{ color: Color.black() }}
        >
          {story || ''}
        </RichText>
      );
    }
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.8rem;
          color: ${Color.darkGray()};
          font-size: 1.4rem;
        `}
      >
        <Icon icon="volume" />
        <span>Listen to this story</span>
      </div>
    );
  };

  const renderContent = () => {
    if (contentType === 'aiStory') {
      return (
        <div className={previewContentClass}>
          {formattedStoryTitle && (
            <div className={storyTitleClass}>{formattedStoryTitle}</div>
          )}
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.6rem;
              flex-wrap: wrap;
            `}
          >
            {typeof difficulty === 'number' && difficulty > 0 && (
              <div className={difficultyChipClass}>
                <Icon icon="layer-group" />
                <span>Level {difficulty}</span>
              </div>
            )}
            {!!isListening && (
              <div className={listeningBadgeClass}>Listening Mode</div>
            )}
          </div>
          {renderStoryContent()}
        </div>
      );
    }

    return (
      <RichText
        isPreview
        maxLines={10}
        contentId={contentId}
        contentType={contentType}
        section="preview"
        isAIMessage={isAIMessage}
        voice={aiVoice}
        style={{ color: Color.black() }}
      >
        {content || story || ''}
      </RichText>
    );
  };

  return (
    <div
      style={{ ...cardVars, ...style }}
      className={containerClass}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {!hideUploader && (
        <div className={headerClass}>
          <div
            style={{ width: '3.8rem', display: 'flex', alignItems: 'center' }}
          >
            <ProfilePic
              style={{ width: '100%' }}
              userId={uploader.id}
              profilePicUrl={uploader.profilePicUrl}
            />
          </div>
          <div className={metaClass}>
            {uploader.username && (
              <div className={uploaderRowClass}>
                <span className={uploaderLabelClass}>
                  by {uploader.username}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {contentType !== 'aiStory' && topic && (
        <strong className={topicLabelClass}>{truncateTopic(topic)}</strong>
      )}
      {renderContent()}
      {filePath && (
        <div
          className={attachmentWrapperClass}
          onClick={(event) => event.stopPropagation()}
        >
          {userId ? (
            <ContentFileViewer
              isThumb
              contentId={contentId}
              contentType={contentType}
              fileName={fileName}
              filePath={filePath}
              fileSize={Number(fileSize)}
              thumbUrl={thumbUrl}
              videoHeight="100%"
              thumbHeight="100%"
            />
          ) : (
            <LoginToViewContent />
          )}
        </div>
      )}
    </div>
  );
}
