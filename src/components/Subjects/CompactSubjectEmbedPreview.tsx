import React from 'react';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { addCommasToNumber, getPlainPreviewText } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

interface CompactSubjectEmbedPreviewProps {
  as?: 'button' | 'span';
  className?: string;
  content: any;
  contentId?: number;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  showThumbnail?: boolean;
  thumbnailUrl?: string;
}

export default function CompactSubjectEmbedPreview({
  as = 'button',
  className = '',
  content,
  contentId,
  onClick,
  showThumbnail = false,
  thumbnailUrl
}: CompactSubjectEmbedPreviewProps) {
  const title = getSubjectTitle(content);
  const body = getSubjectBody(content);
  const rewardLevel = Number(content?.rewardLevel || 0);
  const appliedThumbnailUrl = String(
    thumbnailUrl || content?.thumbUrl || content?.thumbnailUrl || ''
  ).trim();
  const shouldShowThumbnail = Boolean(showThumbnail && appliedThumbnailUrl);
  const Element = as;
  const elementProps =
    as === 'button'
      ? {
          type: 'button' as const
        }
      : {};

  return (
    <Element
      {...elementProps}
      className={[
        compactSubjectEmbedPreviewClass,
        'compact-main-content-embed--subject',
        shouldShowThumbnail
          ? 'compact-subject-embed-preview--has-media compact-main-content-embed--has-media'
          : '',
        className,
        as === 'span' ? 'compact-subject-embed-preview--inline' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-content-id={contentId}
      onClick={onClick}
    >
      <span className="compact-subject-embed-preview__copy compact-main-content-embed__copy">
        {rewardLevel > 0 ? (
          <CompactSubjectEffortBadge
            compact={as === 'span'}
            rewardLevel={rewardLevel}
          />
        ) : (
          <span className="compact-subject-embed-preview__label compact-subject-embed-preview__label--neutral compact-main-content-embed__label">
            Subject
          </span>
        )}
        {title ? <strong>{title}</strong> : null}
        {body ? <p>{body}</p> : null}
        {content?.fileName || content?.filePath ? (
          <span className="compact-subject-embed-preview__attachment compact-main-content-embed__attachment">
            {content.fileName || 'Attachment'}
          </span>
        ) : null}
      </span>
      {shouldShowThumbnail ? (
        <img
          className="compact-subject-embed-preview__media compact-main-content-embed__media"
          src={appliedThumbnailUrl}
          alt={title || body || 'Subject preview'}
          loading="lazy"
        />
      ) : null}
    </Element>
  );
}

function CompactSubjectEffortBadge({
  compact,
  rewardLevel
}: {
  compact?: boolean;
  rewardLevel: number;
}) {
  const level = Math.max(1, Math.floor(Number(rewardLevel || 1)));
  const starCount = Math.min(level, 5);
  const colorKey = cardLevelHash[level]?.color || 'logoBlue';
  const colorGetter = (Color as any)[colorKey];
  const color =
    typeof colorGetter === 'function' ? colorGetter() : Color.logoBlue();

  return (
    <span
      className="compact-subject-embed-preview__effort-badge compact-main-content-embed__effort-badge"
      style={
        { '--subject-effort-color': color } as React.CSSProperties & {
          '--subject-effort-color': string;
        }
      }
    >
      {compact ? (
        <span className="compact-subject-embed-preview__effort-stars compact-subject-embed-preview__effort-stars--compact">
          {Array.from({ length: starCount }, (_, index) => (
            <Icon key={index} icon="star" />
          ))}
        </span>
      ) : (
        <>
          <span>Effort</span>
          <span className="compact-subject-embed-preview__effort-stars">
            {Array.from({ length: starCount }, (_, index) => (
              <Icon key={index} icon="star" />
            ))}
          </span>
        </>
      )}
      <span className="compact-subject-embed-preview__effort-xp compact-main-content-embed__effort-xp">
        {addCommasToNumber(level * 2000)} XP
      </span>
    </span>
  );
}

function getSubjectTitle(content: any) {
  return getPlainPreviewText(content?.title || content?.topic || '');
}

function getSubjectBody(content: any) {
  return getPlainPreviewText(content?.description || content?.content || '');
}

const compactSubjectEmbedPreviewClass = css`
  appearance: none;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: 7.6rem;
  overflow: hidden;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  box-shadow: inset 0 0 0 1px ${Color.whiteGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &.compact-subject-embed-preview--has-media {
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 28%);
    gap: 0.85rem;
  }

  &.compact-subject-embed-preview--inline {
    height: 100%;
    min-height: 0;
    padding: 0.28rem;
    border-radius: 0.72rem;
    box-shadow: none;
    cursor: inherit;
  }

  .compact-subject-embed-preview__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.35rem;
  }

  .compact-subject-embed-preview__label {
    align-self: flex-start;
    color: ${Color.orange()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }

  .compact-subject-embed-preview__label--neutral {
    padding: 0.15rem 0.55rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 999px;
    color: ${Color.darkGray()};
    background: #fff;
  }

  .compact-subject-embed-preview__effort-badge {
    align-self: flex-start;
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    gap: 0.35rem;
    overflow: hidden;
    padding: 0.17rem 0.6rem;
    border: 1px solid var(--subject-effort-color);
    border-radius: 999px;
    color: var(--subject-effort-color);
    background: #fff;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
    white-space: nowrap;
  }

  .compact-subject-embed-preview__effort-stars {
    display: inline-flex;
    align-items: center;
    gap: 0.12rem;
    color: ${Color.gold()};
    font-size: 1rem;
  }

  .compact-subject-embed-preview__effort-xp {
    color: var(--subject-effort-color);
  }

  .compact-subject-embed-preview__copy strong {
    display: -webkit-box;
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.25rem;
    font-weight: 900;
    line-height: 1.15;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .compact-subject-embed-preview__copy p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.25;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .compact-subject-embed-preview__attachment {
    max-width: 100%;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compact-subject-embed-preview__media {
    align-self: stretch;
    width: 100%;
    min-height: 5.8rem;
    max-height: 7.2rem;
    overflow: hidden;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.75rem;
    background: #fff;
    object-fit: cover;
  }

  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__copy {
    gap: 0.14rem;
  }

  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__effort-badge,
  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__label {
    max-width: 100%;
    padding: 0.08rem 0.28rem;
    font-size: 1rem;
  }

  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__effort-badge {
    padding-inline: 0.18rem;
  }

  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__effort-stars--compact {
    gap: 0.02rem;
    transform: scale(0.78);
    transform-origin: left center;
  }

  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__effort-xp,
  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__media,
  &.compact-subject-embed-preview--inline
    .compact-subject-embed-preview__attachment,
  &.compact-subject-embed-preview--inline p {
    display: none;
  }

  &.compact-subject-embed-preview--inline strong {
    font-size: 1rem;
    line-height: 1.08;
    -webkit-line-clamp: 2;
  }
`;
