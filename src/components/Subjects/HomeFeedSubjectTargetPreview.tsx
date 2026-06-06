import React from 'react';
import RichText from '~/components/Texts/RichText';

export default function HomeFeedSubjectTargetPreview({
  className = '',
  contentId,
  contentType = 'subject',
  descriptionText,
  hasBuildEmbedMedia = false,
  maxDescriptionLines = 2,
  mediaPreview,
  rewardPreview,
  subject,
  theme,
  uploaderName
}: {
  className?: string;
  contentId?: number;
  contentType?: string;
  descriptionText?: string;
  hasBuildEmbedMedia?: boolean;
  maxDescriptionLines?: number;
  mediaPreview?: React.ReactNode;
  rewardPreview?: React.ReactNode;
  subject: any;
  theme?: string;
  uploaderName?: string;
}) {
  const subjectId = Number(contentId || subject?.contentId || subject?.id || 0);
  const title = String(subject?.title || '').trim();
  const body =
    typeof descriptionText === 'string'
      ? descriptionText
      : String(subject?.description || subject?.content || '');
  const resolvedUploaderName =
    typeof uploaderName === 'string'
      ? uploaderName.trim()
      : getSubjectUploaderName(subject);

  return (
    <div
      className={[
        'home-feed-card__target-content home-feed-card__target-subject',
        mediaPreview ? 'has-media' : '',
        hasBuildEmbedMedia ? 'has-build-embed-media' : '',
        rewardPreview ? 'has-reward' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="home-feed-card__target-copy">
        {rewardPreview}
        {title ? <h4>{title}</h4> : null}
        {resolvedUploaderName ? (
          <span className="home-feed-card__target-subject-meta">
            Posted by {resolvedUploaderName}
          </span>
        ) : null}
        {body ? (
          <div className="home-feed-card__target-subject-description-slot">
            <RichText
              className="home-feed-card__target-subject-description"
              contentId={subjectId}
              contentType={contentType}
              isPreview
              maxLines={maxDescriptionLines}
              section="description"
              theme={theme}
            >
              {body}
            </RichText>
          </div>
        ) : null}
      </div>
      {mediaPreview}
    </div>
  );
}

function getSubjectUploaderName(subject: any) {
  const uploader = subject?.uploader;
  if (typeof uploader === 'string') return uploader.trim();
  return String(
    uploader?.username ||
      subject?.username ||
      subject?.uploaderUsername ||
      subject?.author?.username ||
      ''
  ).trim();
}
