import React from 'react';
import Icon from '~/components/Icon';
import { borderRadius, Color } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';

// Picture Day (10-24): the picture a member made, with its quiet type cue.
// Shown wherever a Picture Day reflection is shown in full (its page, and the
// reflection a comment replies to); the description follows as the text.
export default function DailyReflectionPicture({
  alt,
  maxWidth = '72rem',
  picturePath,
  pictureStyle,
  style
}: {
  alt?: string;
  maxWidth?: string;
  picturePath: string;
  pictureStyle?: string | null;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <img
        src={`${cloudFrontURL}/${picturePath}`}
        alt={alt || 'Picture Day picture'}
        loading="lazy"
        style={{
          display: 'block',
          width: '100%',
          maxWidth,
          margin: '0 auto',
          borderRadius,
          border: `1px solid ${Color.borderGray()}`,
          background: Color.whiteGray()
        }}
      />
      <div
        style={{
          marginTop: '0.8rem',
          display: 'flex',
          alignItems: 'center',
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
        {pictureStyle ? (
          <span
            style={{
              fontWeight: 700,
              letterSpacing: 0,
              textTransform: 'none',
              color: Color.gray()
            }}
          >
            · {pictureStyle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
