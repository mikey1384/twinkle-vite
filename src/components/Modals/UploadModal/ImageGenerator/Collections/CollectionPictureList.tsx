import React, { useId } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import { cloudFrontURL } from '~/constants/defaultValues';
import { mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  AI_IMAGE_COLLECTION_LABEL_MAX,
  AI_IMAGE_COLLECTION_PICTURE_NOTE_MAX,
  AI_IMAGE_COLLECTION_ROLES,
  getAIImageCollectionRole,
  type AIImageCollectionImage,
  type AIImageCollectionRole
} from '~/helpers/aiImageHistory';

// A collection's pictures in Collection Settings (v2, Mikey 11-16): each one
// with its job (Character, Art style, Place, Thing or logo, Other), a name
// for someone or something, and what to keep the same. The AI is told each
// picture's job, so an art style picture changes the look, not the content.
export default function CollectionPictureList({
  images,
  disabled,
  themeColor = 'logoBlue',
  onChange
}: {
  images: AIImageCollectionImage[];
  disabled?: boolean;
  themeColor?: string;
  onChange: (images: AIImageCollectionImage[]) => void;
}) {
  const themeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor
  });
  return (
    <ul
      className={listCls}
      style={
        {
          '--picture-accent': themeRole.getColor(),
          '--picture-soft': themeRole.getColor(0.1)
        } as React.CSSProperties
      }
    >
      {images.map((image, index) => (
        <PictureRow
          key={image.id}
          image={image}
          index={index}
          disabled={disabled}
          onChange={(next) =>
            onChange(images.map((item) => (item.id === image.id ? next : item)))
          }
          onRemove={() =>
            onChange(images.filter((item) => item.id !== image.id))
          }
        />
      ))}
    </ul>
  );
}

function PictureRow({
  image,
  index,
  disabled,
  onChange,
  onRemove
}: {
  image: AIImageCollectionImage;
  index: number;
  disabled?: boolean;
  onChange: (image: AIImageCollectionImage) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const role = getAIImageCollectionRole(image.role);
  const labelTooLong = image.label.length > AI_IMAGE_COLLECTION_LABEL_MAX;
  const noteTooLong = image.note.length > AI_IMAGE_COLLECTION_PICTURE_NOTE_MAX;
  return (
    <li className={rowCls}>
      <div className={thumbCls}>
        <img
          src={`${cloudFrontURL}/${image.path}`}
          alt={`Picture ${index + 1} in this collection`}
          loading="lazy"
        />
        <button
          type="button"
          className={removeCls}
          disabled={disabled}
          onClick={onRemove}
          aria-label="Take this picture out"
          title="Take this picture out"
        >
          <Icon icon="times" />
        </button>
      </div>
      <div className={fieldsCls}>
        <div
          className={rolesCls}
          role="radiogroup"
          aria-label={`What picture ${index + 1} is`}
        >
          {AI_IMAGE_COLLECTION_ROLES.map((entry) => {
            const selected = entry.role === role.role;
            return (
              <button
                key={entry.role}
                type="button"
                role="radio"
                aria-checked={selected}
                data-selected={selected}
                className={roleCls}
                disabled={disabled}
                onClick={() => handleRole(entry.role)}
              >
                <Icon icon={entry.icon} />
                <span>{entry.label}</span>
              </button>
            );
          })}
        </div>
        <p className={helpCls}>{role.help}</p>
        {role.named && (
          <Input
            id={`${id}-label`}
            aria-label={`${role.label} name`}
            aria-invalid={labelTooLong}
            hasError={labelTooLong}
            placeholder={role.namePlaceholder}
            value={image.label}
            disabled={disabled}
            style={inputStyle}
            onChange={(label: string) => onChange({ ...image, label })}
          />
        )}
        <Input
          id={`${id}-note`}
          aria-label={
            role.role === 'other'
              ? 'What to take from this picture'
              : 'What to keep the same from this picture (optional)'
          }
          aria-invalid={noteTooLong}
          hasError={noteTooLong}
          placeholder={role.notePlaceholder}
          value={image.note}
          disabled={disabled}
          style={inputStyle}
          onChange={(note: string) => onChange({ ...image, note })}
        />
        {(labelTooLong || noteTooLong) && (
          <p className={helpCls} data-error="true" role="alert">
            {labelTooLong
              ? `Keep the name within ${AI_IMAGE_COLLECTION_LABEL_MAX} characters.`
              : `Keep this within ${AI_IMAGE_COLLECTION_PICTURE_NOTE_MAX} characters.`}
          </p>
        )}
      </div>
    </li>
  );

  function handleRole(next: AIImageCollectionRole) {
    // a name belongs to someone or something; other jobs drop it
    onChange({
      ...image,
      role: next,
      label: getAIImageCollectionRole(next).named ? image.label : ''
    });
  }
}

const listCls = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const rowCls = css`
  display: grid;
  grid-template-columns: calc(96 * var(--px)) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 10px;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: #fff;
  animation: collectionPictureIn 0.22s ease both;
  @keyframes collectionPictureIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 10px;
    padding: 8px;
  }
`;

const thumbCls = css`
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  background: #eef1f5;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const removeCls = css`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const fieldsCls = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const rolesCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const roleCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 32px;
  padding: 0 0.9rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: #334155;
  font: inherit;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
  svg {
    color: var(--picture-accent);
  }
  &:hover:not(:disabled) {
    background: var(--picture-soft);
    border-color: var(--picture-accent);
  }
  &[data-selected='true'] {
    background: var(--picture-accent);
    border-color: var(--picture-accent);
    color: #fff;
    svg {
      color: #fff;
    }
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const helpCls = css`
  margin: 0;
  color: #526176;
  font-size: 1.3rem;
  line-height: 1.4;
  &[data-error='true'] {
    color: #b42318;
  }
`;

const inputStyle: React.CSSProperties = {
  minHeight: 38,
  fontSize: '1.5rem'
};
