import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import CompactEffortStrip from './CompactEffortStrip';
import HomeFeedSubjectTargetPreview from './HomeFeedSubjectTargetPreview';
import SubjectMediaPreview from './SubjectMediaPreview';
import { resolveWideSubjectMedia } from './wideSubjectMedia';

export default function WideSubjectEmbedPreview({
  className = '',
  contentId,
  contentType = 'subject',
  descriptionEmbedPreview,
  descriptionText,
  hasBuildEmbedMedia = false,
  maxDescriptionLines = 2,
  mediaPreview,
  subject,
  theme,
  uploaderName
}: {
  className?: string;
  contentId?: number;
  contentType?: string;
  descriptionEmbedPreview?: React.ReactNode;
  descriptionText?: string;
  hasBuildEmbedMedia?: boolean;
  maxDescriptionLines?: number;
  mediaPreview?: React.ReactNode;
  subject: any;
  theme?: string;
  uploaderName?: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const subjectId = Number(contentId || subject?.contentId || subject?.id || 0);
  const rewardLevel = Number(subject?.rewardLevel || 0);
  const derivedMedia = resolveWideSubjectMedia(subject);
  const appliedMediaPreview =
    mediaPreview !== undefined ? (
      mediaPreview
    ) : derivedMedia ? (
      <SubjectMediaPreview
        className="home-feed-card__target-media-wrap"
        descriptor={derivedMedia}
        subject={subject}
        subjectId={subjectId}
        userId={Number(userId || 0)}
      />
    ) : null;

  return (
    <HomeFeedSubjectTargetPreview
      className={`${wideSubjectEmbedPreviewClass} ${className}`}
      contentId={subjectId}
      contentType={contentType}
      descriptionEmbedPreview={descriptionEmbedPreview}
      descriptionText={descriptionText}
      hasBuildEmbedMedia={hasBuildEmbedMedia}
      maxDescriptionLines={maxDescriptionLines}
      mediaPreview={appliedMediaPreview}
      rewardPreview={
        rewardLevel > 0 ? (
          <CompactEffortStrip
            className="home-feed-card__target-reward-bar"
            rewardLevel={rewardLevel}
          />
        ) : null
      }
      subject={subject}
      theme={theme}
      uploaderName={uploaderName}
    />
  );
}

const wideSubjectEmbedPreviewClass = css`
  --home-feed-content-font-size: max(1.9rem, 19px);
  --home-feed-secondary-content-font-size: max(1.8rem, 18px);
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 0.8rem;
  width: 100%;
  height: auto;
  min-height: max(13rem, 130px);
  overflow: hidden;
  padding: 0.65rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  background: #fff;
  container-type: inline-size;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: ${Color.logoBlue(0.34)};
    }
  }

  .full-width-subject-embed-preview:focus-visible & {
    outline: 2px solid ${Color.logoBlue(0.42)};
    outline-offset: 2px;
  }

  &.has-media {
    grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 32%);
  }

  &.has-build-embed-media {
    grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 28%);
  }

  .home-feed-card__target-copy {
    display: flex;
    min-width: 0;
    height: auto;
    min-height: 0;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.24rem;
    overflow: hidden;
    color: ${Color.darkerGray()};
    font-size: var(--home-feed-secondary-content-font-size);
    line-height: 1.34;
  }

  .home-feed-card__target-copy > h4 {
    flex: 0 0 auto;
    min-height: max(2.25rem, 22.5px);
    margin: 0;
    overflow: hidden;
    color: ${Color.black()};
    font-size: var(--home-feed-content-font-size);
    font-weight: 850;
    line-height: 1.18;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .home-feed-card__target-subject-meta {
    display: block;
    min-width: 0;
    min-height: max(1.37rem, 13.7px);
    flex: 0 0 auto;
    overflow: hidden;
    color: ${Color.gray()};
    font-size: max(1.12rem, 11.2px);
    font-weight: 700;
    line-height: 1.22;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-feed-card__target-subject-description-slot {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .home-feed-card__target-subject-description-slot > * {
    max-height: 100%;
  }

  .home-feed-card__target-subject-embed-slot {
    flex: 0 0 auto;
    min-height: 0;
    margin-top: 0.4rem;
  }

  .home-feed-card__target-media-wrap {
    box-sizing: border-box;
    display: flex;
    align-self: stretch;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 7.5rem;
    overflow: hidden;
    border: 0;
    border-radius: 0.7rem;
    background: ${Color.whiteGray()};
  }

  /* Fill helpers for ContentFileViewer/embed wrappers only. The attachment
     card lays out its own children (icon square, copy column), so the filler
     must not reach inside it — it used to collapse the icon into a full-height
     sliver by overriding its fixed square size. */
  .home-feed-card__target-media-wrap > div,
  .home-feed-card__target-media-wrap
    > div:not(.home-feed-card__attachment-card)
    > div {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .home-feed-card__target-media-wrap img,
  .home-feed-card__target-media-wrap video {
    display: block;
    width: 100%;
    height: 100%;
    max-height: none;
    object-fit: contain;
  }

  .home-feed-card__target-media-wrap[data-subject-media-kind='video-root'],
  .home-feed-card__target-media-wrap[data-attachment-preview-kind='video'] {
    background: #111827;
  }

  .home-feed-card__target-media-wrap[data-subject-media-kind='url-root'] img {
    object-fit: cover;
  }

  .home-feed-card__video-attachment {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: 0.7rem;
    background: #111827;
  }

  .home-feed-card__video-attachment img,
  .home-feed-card__video-attachment video {
    background: #111827;
    pointer-events: none;
  }

  .home-feed-card__video-attachment-play {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.35rem;
    height: 3.35rem;
    border: 2px solid rgba(255, 255, 255, 0.86);
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.58);
    color: #fff;
    font-size: 1.25rem;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  .home-feed-card__video-attachment-title {
    position: absolute;
    box-sizing: border-box;
    bottom: 0.55rem;
    left: 0.55rem;
    width: fit-content;
    max-width: calc(100% - 1.1rem);
    overflow: hidden;
    padding: 0.34rem 0.52rem;
    border-radius: 0.55rem;
    background: rgba(17, 24, 39, 0.74);
    color: #fff;
    font-size: 1.1rem;
    font-weight: 850;
    line-height: 1.15;
    pointer-events: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* The media column is narrow (32% of the panel), so the attachment card
     renders as a centered vertical tile — mirroring the main feed card's
     --subject-file treatment — instead of an icon | copy | chip row that has
     no room to breathe. */
  .home-feed-card__attachment-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    width: 100%;
    height: 100%;
    min-width: 0;
    padding: 0.9rem;
    border: 1px solid ${Color.logoBlue(0.16)};
    border-radius: 0.7rem;
    background: #fff;
    color: ${Color.darkerGray()};
    text-align: center;
  }

  .home-feed-card__attachment-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.6rem;
    height: 4.6rem;
    border-radius: 1.2rem;
    background: ${Color.logoBlue(0.12)};
    color: ${Color.logoBlue()};
    font-size: 2.2rem;
  }

  .home-feed-card__attachment-card-copy {
    display: flex;
    min-width: 0;
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    line-height: 1.18;
  }

  .home-feed-card__attachment-card-copy span,
  .home-feed-card__attachment-card-copy small {
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 800;
  }

  .home-feed-card__attachment-card-copy strong {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.1rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-feed-card__attachment-card-extension {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3.2rem;
    min-height: 2rem;
    padding: 0.32rem 0.56rem;
    border-radius: 999px;
    background: ${Color.black(0.06)};
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }

  .home-feed-card__target-reward-bar {
    flex: 0 0 auto;
    margin-bottom: 0.1rem;
    min-height: 2.4rem;
    padding: 0.36rem 0.58rem;
    border-radius: 0.65rem;
  }

  .home-feed-card__target-reward-bar .home-feed-card__compact-effort-label,
  .home-feed-card__target-reward-bar .home-feed-card__compact-effort-xp {
    font-size: 1rem;
  }

  .home-feed-card__target-reward-bar .home-feed-card__compact-effort-stars {
    font-size: 1.08rem;
  }

  .home-feed-card__target-reward-bar .home-feed-card__compact-effort-xp {
    display: none;
  }

  @media (max-width: ${mobileMaxWidth}) {
    min-height: max(12rem, 120px);
    border-left: 0;
    border-right: 0;
    border-radius: 0;

    .home-feed-card__target-copy > h4 {
      min-height: max(2.36rem, 23.6px);
      font-size: 1.9rem;
      line-height: 1.24;
    }
  }
`;
