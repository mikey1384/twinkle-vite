import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import type { SharedAttachment } from '~/helpers/chatSharedMedia';

export default function Thumbnail({ item }: { item: SharedAttachment }) {
  const [failed, setFailed] = useState('');
  const src = item.thumbUrl || (item.fileType === 'image' ? item.url : '');
  return (
    <span
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        background: #f1f5f9;
        color: #64748b;
        border-radius: inherit;
        > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        > i {
          position: absolute;
          bottom: 8px;
          right: 8px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          color: #fff;
          background: #172033b3;
          font-size: 11px;
        }
      `}
    >
      {src && failed !== src ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
      ) : (
        <Icon
          icon={
            item.fileType === 'video'
              ? 'film'
              : item.fileType === 'audio'
                ? 'music'
                : item.fileType === 'image'
                  ? 'image'
                  : 'file-alt'
          }
        />
      )}
      {item.fileType === 'video' && (
        <i aria-hidden>
          <Icon icon="play" />
        </i>
      )}
    </span>
  );
}
