import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';

// In place of a blocked site's link preview (Embedly, feed card link
// targets, link attachments): "This site is blocked on Twinkle." and the
// host as plain text. No link, and no title, text or picture from the site.
export function blockedLinkHost(url?: string | null) {
  try {
    const raw = String(url || '').trim();
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`).hostname;
  } catch {
    return '';
  }
}

export default function BlockedLinkPreview({
  url,
  className,
  compact = false
}: {
  url?: string | null;
  className?: string;
  // a narrow tile: the message only
  compact?: boolean;
}) {
  const host = compact ? '' : blockedLinkHost(url);
  return (
    <div
      data-testid="blocked-link-preview"
      className={`${css`
        display: flex;
        align-items: center;
        gap: 0.8rem;
        box-sizing: border-box;
        padding: 1rem 1.2rem;
        border-radius: 8px;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.wellGray()};
        color: ${Color.darkerGray()};
        font-size: 1.4rem;
        line-height: 1.4;
        overflow-wrap: anywhere;
      `}${className ? ` ${className}` : ''}`}
    >
      <Icon icon="ban" style={{ color: Color.gray() }} />
      <span>
        This site is blocked on {SITE_NAME}.
        {host ? <span style={{ color: Color.gray() }}> {host}</span> : null}
      </span>
    </div>
  );
}
