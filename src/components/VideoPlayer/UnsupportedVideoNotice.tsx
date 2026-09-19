import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

// Shown in place of a file video this browser refused to load: MKV on any iOS
// browser, AVI/WMV everywhere. A play button that does nothing reads as a bug;
// this says what happened and leaves a way to get the file.
export default function UnsupportedVideoNotice({
  src,
  style
}: {
  src?: string;
  style?: React.CSSProperties;
}) {
  const format = getFormatLabel(src);
  return (
    <div
      style={style}
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        min-height: 12rem;
        padding: 2rem 1.5rem;
        box-sizing: border-box;
        text-align: center;
        background: ${Color.wellGray(0.6)};
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        color: ${Color.darkerGray()};
      `}
    >
      <Icon icon="film" size="2x" />
      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
        This video can&apos;t play on this device
      </div>
      <div style={{ fontSize: '1.2rem', lineHeight: 1.5 }}>
        {format
          ? `It is in ${format} format, which this browser doesn't support.`
          : `This browser doesn't support the video's format.`}{' '}
        It may play on a computer.
      </div>
      {src && (
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={css`
            font-size: 1.3rem;
            font-weight: 700;
            color: ${Color.logoBlue()};
          `}
        >
          <Icon icon="download" /> Download the video
        </a>
      )}
    </div>
  );
}

function getFormatLabel(src?: string) {
  if (!src) return '';
  const path = src.split(/[?#]/)[0];
  const match = /\.([a-z0-9]{2,5})$/i.exec(path);
  return match ? match[1].toUpperCase() : '';
}
