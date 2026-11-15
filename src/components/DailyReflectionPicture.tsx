import React from 'react';
import Icon from '~/components/Icon';
import { useDailyPicture } from '~/components/DailyPictureViewer';
import { borderRadius, Color } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';

// Picture Day (10-24): the picture a member made, with its quiet type cue.
// Shown wherever a Picture Day reflection is shown in full (its page, and the
// reflection a comment replies to); the description follows as the text.
// Tapping it opens the standard image viewer (11-15); its owner can edit it
// there and make the edit the reflection's picture.
export default function DailyReflectionPicture({
  alt,
  maxWidth = '72rem',
  picturePath,
  pictureStyle,
  responseId,
  ownerId,
  viewable = true,
  style
}: {
  alt?: string;
  maxWidth?: string;
  picturePath: string;
  pictureStyle?: string | null;
  // the reflection (daily_question_responses id) and its author
  responseId?: number | null;
  ownerId?: number | null;
  // false where the surface turns image viewers off (ContentPreview)
  viewable?: boolean;
  style?: React.CSSProperties;
}) {
  const {
    shownPath,
    shownStyle,
    openViewer,
    viewer,
    canRestoreOriginal,
    restoreOriginal,
    restoring,
    restoreError
  } = useDailyPicture({
    picturePath,
    pictureStyle,
    responseId,
    ownerId,
    surface: 'post'
  });
  return (
    <div style={style}>
      <button
        type="button"
        disabled={!viewable}
        onClick={(event) => {
          // inside clickable previews: open the picture, not the post
          event.stopPropagation();
          openViewer();
        }}
        aria-label="Open picture"
        style={{
          color: 'inherit',
          display: 'block',
          width: '100%',
          maxWidth,
          margin: '0 auto',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: viewable ? 'zoom-in' : 'inherit',
          pointerEvents: viewable ? undefined : 'none'
        }}
      >
        <img
          src={`${cloudFrontURL}/${shownPath}`}
          alt={alt || 'Picture Day picture'}
          loading="lazy"
          style={{
            display: 'block',
            width: '100%',
            borderRadius,
            border: `1px solid ${Color.borderGray()}`,
            background: Color.whiteGray()
          }}
        />
      </button>
      <div
        style={{
          marginTop: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '1.2rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: Color.darkGray()
        }}
      >
        <Icon icon="palette" />
        Picture Day
        {shownStyle ? (
          <span
            style={{
              fontWeight: 700,
              letterSpacing: 0,
              textTransform: 'none',
              color: Color.gray()
            }}
          >
            · {shownStyle}
          </span>
        ) : null}
        {canRestoreOriginal && (
          <button
            type="button"
            disabled={restoring}
            onClick={(event) => {
              event.stopPropagation();
              void restoreOriginal();
            }}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'none',
              padding: 0,
              fontSize: '1.2rem',
              fontWeight: 700,
              letterSpacing: 0,
              textTransform: 'none',
              color: Color.logoBlue(),
              cursor: restoring ? 'default' : 'pointer'
            }}
          >
            {restoring ? 'Switching back…' : 'Use the original picture'}
          </button>
        )}
      </div>
      {restoreError && (
        <p
          role="alert"
          style={{ margin: '0.5rem 0 0', fontSize: '1.2rem', color: Color.rose() }}
        >
          {restoreError}
        </p>
      )}
      {viewer}
    </div>
  );
}
