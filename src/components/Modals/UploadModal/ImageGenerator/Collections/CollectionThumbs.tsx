import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { cloudFrontURL } from '~/constants/defaultValues';
import type { AIImageCollection } from '~/helpers/aiImageHistory';

// A collection's pictures as a small overlapping stack, so a collection is
// recognised by its characters at a glance (the bar, the list, the picker).
export default function CollectionThumbs({
  images,
  size = 32,
  max = 3
}: {
  images: AIImageCollection['images'];
  size?: number;
  max?: number;
}) {
  const shown = images.slice(0, max);
  const extra = images.length - shown.length;
  return (
    <span
      className={stackCls}
      style={{ '--thumb-size': `calc(${size} * var(--px))` } as any}
      aria-hidden
    >
      {shown.length ? (
        shown.map((image) => (
          <img
            key={image.id}
            src={`${cloudFrontURL}/${image.path}`}
            alt=""
            loading="lazy"
          />
        ))
      ) : (
        <span className="empty">
          <Icon icon="images" />
        </span>
      )}
      {extra > 0 && <span className="more">+{extra}</span>}
    </span>
  );
}

const stackCls = css`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  img,
  .empty,
  .more {
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 8px;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
    background: #eef1f5;
  }
  img {
    display: block;
    object-fit: cover;
  }
  > * + * {
    margin-left: calc(var(--thumb-size) * -0.35);
  }
  .empty,
  .more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #526176;
    font-size: calc(12 * var(--px));
    font-weight: 700;
  }
`;
