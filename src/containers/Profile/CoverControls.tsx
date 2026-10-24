import React, { useRef } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';

// The owner's cover toolbar: the theme button, and on platinum the cover
// photo tools and the shine switch. One row of quiet glass chips, labels on
// desktop and icons with labels kept for screen readers on phones.
export default function CoverControls({
  isPlatinum,
  hasPhoto,
  shine,
  themeIsNew,
  busy,
  uploading,
  uploadProgress,
  onOpenThemes,
  onPickPhoto,
  onReposition,
  onRemovePhoto,
  onToggleShine
}: {
  isPlatinum: boolean;
  hasPhoto: boolean;
  shine: boolean;
  themeIsNew: boolean;
  busy: boolean;
  uploading: boolean;
  uploadProgress: number;
  onOpenThemes: () => void;
  onPickPhoto: (file: File) => void;
  onReposition: () => void;
  onRemovePhoto: () => void;
  onToggleShine: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className={barClass}>
      {isPlatinum && (
        <>
          <button
            type="button"
            className={chipClass}
            disabled={busy || uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Icon icon="image" />
            <span className={labelClass}>
              {uploading
                ? `Uploading ${Math.round(uploadProgress * 100)}%`
                : hasPhoto
                  ? 'Change photo'
                  : 'Add cover photo'}
            </span>
          </button>
          {hasPhoto && (
            <>
              <button
                type="button"
                className={chipClass}
                disabled={busy || uploading}
                onClick={onReposition}
              >
                <Icon icon="arrows-alt" />
                <span className={labelClass}>Reposition</span>
              </button>
              <button
                type="button"
                className={chipClass}
                disabled={busy || uploading}
                onClick={onRemovePhoto}
                aria-label="Remove cover photo"
              >
                <Icon icon="trash-alt" />
              </button>
            </>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={shine}
            className={cx(chipClass, switchClass)}
            disabled={busy}
            onClick={onToggleShine}
          >
            <Icon icon="sparkles" />
            <span className={labelClass}>Shine</span>
            <span
              className={cx(trackClass, shine && trackOnClass)}
              aria-hidden="true"
            >
              <i />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onPickPhoto(file);
            }}
          />
        </>
      )}
      <button
        type="button"
        className={cx(chipClass, primaryChipClass)}
        onClick={onOpenThemes}
      >
        <Icon icon="palette" />
        <span className={labelClass}>Change theme</span>
        {themeIsNew && <span className={newClass}>New</span>}
      </button>
    </div>
  );
}

const barClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
`;
const chipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 3.4rem;
  padding: 0 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #262a31;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(20, 24, 30, 0.14);
  transition:
    background-color 160ms ease,
    transform 160ms ease;
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  &:focus-visible {
    outline: 3px solid rgba(65, 140, 235, 0.7);
    outline-offset: 2px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 3rem;
    padding: 0 0.95rem;
    font-size: 1.15rem;
  }
`;
const primaryChipClass = css`
  background: rgba(38, 42, 49, 0.86);
  border-color: rgba(38, 42, 49, 0.2);
  color: #fff;
  &:hover:not(:disabled) {
    background: rgba(38, 42, 49, 0.96);
  }
`;
// labels hide on phones; the icon stays and the label remains for screen readers
const labelClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;
const switchClass = css`
  padding-right: 0.8rem;
`;
const trackClass = css`
  position: relative;
  width: 3rem;
  height: 1.7rem;
  border-radius: 999px;
  background: #b8bec7;
  transition: background-color 160ms ease;
  i {
    position: absolute;
    top: 0.2rem;
    left: 0.2rem;
    width: 1.3rem;
    height: 1.3rem;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    transition: transform 160ms ease;
  }
`;
const trackOnClass = css`
  background: #3e4652;
  i {
    transform: translateX(1.3rem);
  }
`;
const newClass = css`
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: linear-gradient(115deg, #a9b0ba, #fbfcfd 45%, #8e96a1);
  color: #262a31;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;
