import React, { useState } from 'react';
import { css } from '@emotion/css';
import ChangePicture from './ChangePicture';
import Icon from '~/components/Icon';

export default function GroupThumbnail({ className, onClick, thumbUrl, style, disabled = false }: {
  className?: string;
  onClick: () => void;
  thumbUrl?: string | null;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const [showChange, setShowChange] = useState(false);
  return <button type="button" className={`${thumbnailClass} ${className || ''}`}
    aria-label={thumbUrl ? 'Change group picture' : 'Choose a group picture'} disabled={disabled}
    style={style} onClick={onClick}
    onMouseEnter={() => setShowChange(true)} onMouseLeave={() => setShowChange(false)}
    onFocus={() => setShowChange(true)} onBlur={() => setShowChange(false)}>
    {thumbUrl ? <img loading="lazy" alt="" src={thumbUrl} /> : <span className="empty">
      <Icon icon="camera" /><span>Add picture</span>
    </span>}
    {thumbUrl && <ChangePicture shown={showChange} />}
  </button>;
}

const thumbnailClass = css`
  display: block;
  position: relative;
  width: 96px;
  height: 96px;
  padding: 0;
  border: 1px solid #b8c4d4;
  border-radius: 16px;
  overflow: hidden;
  background: #f1f5f9;
  color: #526176;
  cursor: pointer;
  font: inherit;
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .empty { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; flex-direction: column; gap: 8px; font-size: 12px; }
  .empty svg { font-size: 24px; }
  &:disabled { cursor: default; opacity: .6; }
`;
