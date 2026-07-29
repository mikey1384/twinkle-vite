import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';
import { Color, mobileMaxWidth } from '~/constants/css';

// The one card shell every Build chat message uses: contribution submissions,
// team invites, and join requests. They are the same kind of object — something
// happened on a project, here is what it is, here is what you can do about it —
// so they share a frame instead of each inventing one.
//
// Themed off the author's profileTheme through the `sharedPrompt` role, the way
// prompt blocks and build cards are themed off their owner, so a message from
// someone reads in their color wherever it appears.
export default function BuildMessageCard({
  bannerIcon = 'code-branch',
  bannerText,
  title,
  chips,
  children,
  actions,
  themeName
}: {
  bannerIcon?: string;
  bannerText: React.ReactNode;
  title?: React.ReactNode;
  chips?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  themeName?: string | null;
}) {
  const { accentColor, borderColor } = useThemedCardVars({
    role: 'sharedPrompt',
    themeName: themeName || undefined
  });

  return (
    <div className={cardClass} style={{ borderColor }}>
      <div className={bannerClass} style={{ background: accentColor }}>
        <Icon icon={bannerIcon} />
        <span>{bannerText}</span>
      </div>
      <div className={bodyClass}>
        {title ? <h3 className={titleClass}>{title}</h3> : null}
        {chips ? <div className={chipRowClass}>{chips}</div> : null}
        {children}
        {actions ? <div className={actionsClass}>{actions}</div> : null}
      </div>
    </div>
  );
}

// Chips read as metadata about the card's subject, so they take the author's
// accent rather than a fixed blue.
export function BuildMessageCardChip({
  icon,
  children,
  themeName,
  muted = false
}: {
  icon?: string;
  children: React.ReactNode;
  themeName?: string | null;
  muted?: boolean;
}) {
  const { accentColor } = useThemedCardVars({
    role: 'sharedPrompt',
    themeName: themeName || undefined
  });
  return (
    <span
      className={chipClass}
      style={
        muted
          ? { background: Color.highlightGray(), color: Color.darkerGray() }
          : { background: withAlpha(accentColor, 0.13), color: accentColor }
      }
    >
      {icon ? <Icon icon={icon} /> : null}
      <span>{children}</span>
    </span>
  );
}

function withAlpha(rgba: string, alpha: number) {
  const match = String(rgba).match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
  );
  if (!match) return rgba;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const cardClass = css`
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  background: #fff;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
  // Twinkle's root font is 10px, so this is 720px on desktop — these cards
  // carry file lists and multiple actions and read cramped at bubble width.
  width: 72rem;
  max-width: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    border-radius: 12px;
  }
`;

const bannerClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.01em;
`;

const bodyClass = css`
  padding: 1rem 1.1rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.9rem;
  }
`;

// The project is what the reader is being asked about, so it is the headline —
// full black, not a grey subtitle under someone else's name.
const titleClass = css`
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.15;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.7rem;
  }
`;

const chipRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const chipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 800;
`;

const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
`;
