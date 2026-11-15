import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { borderRadius, Color } from '~/constants/css';

// A featured entry the owner can't open right now (its post went private or
// was hidden). Visitors never see it; the owner sees it here and can remove it.
export default function UnavailableFeaturedItem({
  item,
  onRemove,
  style
}: {
  item: { contentType?: string };
  onRemove: () => void;
  style?: React.CSSProperties;
}) {
  const kind = item?.contentType === 'comment' ? 'comment' : 'subject';
  return (
    <div
      style={style}
      className={css`
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.2rem 1.4rem;
        border: 1px dashed var(--ui-border-strong);
        border-radius: ${borderRadius};
        background: ${Color.wellGray(0.5)};
        color: ${Color.darkGray()};
        font-size: 1.3rem;
      `}
    >
      <Icon icon="eye-slash" />
      <span style={{ flex: 1, minWidth: 0 }}>
        This featured {kind} is unavailable right now.
      </span>
      <Button variant="ghost" size="sm" color="rose" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
