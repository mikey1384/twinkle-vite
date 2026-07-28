import React from 'react';
import Icon from '~/components/Icon';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';

export interface SharedPromptStat {
  icon?: string;
  label: string;
  onClick?: () => void;
  value: React.ReactNode;
}

/**
 * The one shared-prompt presentation used everywhere a prompt's instructions
 * are shown: the home feed's prompt card, and the rich-text embed of a prompt.
 * Callers own the instructions node (so each surface keeps its own clamping)
 * and everything else — chip, title, byline, stats, well, footer — is this
 * component's, so the surfaces cannot drift apart again.
 *
 * Themed off the prompt author, like build cards are themed off their owner.
 */
export default function SharedPromptBlock({
  children,
  className,
  density = 'default',
  footer,
  headerRight,
  instructionsClassName,
  meta,
  onTitleClick,
  stats,
  statsRight,
  style,
  themeName,
  title,
  variant = 'card'
}: {
  children?: React.ReactNode;
  className?: string;
  // `compact` is the same design at the smaller scale the target panel and the
  // inline embed tiles have room for.
  density?: 'compact' | 'default';
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  instructionsClassName?: string;
  meta?: React.ReactNode;
  onTitleClick?: () => void;
  stats?: SharedPromptStat[];
  // Rendered at the end of the stats row (e.g. a share button).
  statsRight?: React.ReactNode;
  style?: React.CSSProperties;
  themeName?: string;
  title?: string;
  // `card` is the standalone embed; `panel` fills a feed card's preview panel,
  // where the frame and its height come from the feed card's own styles.
  variant?: 'card' | 'panel';
}) {
  // The accent comes from the `sharedPrompt` theme role, so each profile theme
  // maps to a color chosen for this surface rather than the raw theme color.
  const { accentColor } = useThemedCardVars({
    role: 'sharedPrompt',
    themeName: themeName || undefined
  });
  const blockVars = React.useMemo(
    () =>
      ({
        '--shared-prompt-accent': accentColor,
        '--shared-prompt-tint': withAlpha(accentColor, 0.08),
        '--shared-prompt-tint-strong': withAlpha(accentColor, 0.16),
        '--shared-prompt-border': withAlpha(accentColor, 0.28),
        ...style
      }) as React.CSSProperties,
    [accentColor, style]
  );

  return (
    <div
      className={cx(
        blockClass,
        'shared-prompt-block',
        variant === 'panel' && 'panel',
        density === 'compact' && 'compact',
        className
      )}
      style={blockVars}
    >
      <div className={headerClass}>
        <span className="shared-prompt__chip">
          <span className="shared-prompt__chip-badge">
            <Icon icon="robot" />
          </span>
          AI Prompt
        </span>
        {headerRight}
      </div>
      {title ? (
        onTitleClick ? (
          <button
            type="button"
            className={cx(titleClass, 'clickable')}
            onClick={onTitleClick}
          >
            {title}
          </button>
        ) : (
          <h3 className={titleClass}>{title}</h3>
        )
      ) : null}
      {meta ? <div className={metaClass}>{meta}</div> : null}
      {stats?.length ? (
        <div className={statsClass}>
          {stats.map((stat) =>
            stat.onClick ? (
              <button
                className="shared-prompt__stat clickable"
                key={stat.label}
                type="button"
                onClick={stat.onClick}
              >
                {stat.icon ? <Icon icon={stat.icon} /> : null}
                <strong>{stat.value}</strong>
                {stat.label}
              </button>
            ) : (
              <span className="shared-prompt__stat" key={stat.label}>
                {stat.icon ? <Icon icon={stat.icon} /> : null}
                <strong>{stat.value}</strong>
                {stat.label}
              </span>
            )
          )}
          {statsRight}
        </div>
      ) : null}
      {children ? (
        <div className={cx(instructionsClass, instructionsClassName)}>
          <div className="shared-prompt__instructions-body">{children}</div>
        </div>
      ) : null}
      {footer ? <div className={footerClass}>{footer}</div> : null}
    </div>
  );
}

function withAlpha(color: string, alpha: number) {
  const match = String(color).match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
  );
  if (!match) return color;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// A prompt is text written for a machine, so it is set in the terminal face the
// app already loads (Roboto Mono) — one font for the label and the instructions
// on every prompt surface.
const monoFontFamily = `'Roboto Mono', 'SF Mono', Menlo, Monaco, 'Courier New', monospace`;

const blockClass = css`
  --shared-prompt-mono: ${monoFontFamily};
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem;
  /* The outer frame is grey like every other card frame on the site; the theme
     lives inside — chip, stats and the instructions well. */
  border: 1px solid ${Color.borderGray()};
  border-radius: 1.4rem;
  background: #fff;
  color: ${Color.darkerGray()};

  &.panel {
    /* The feed sets the preview font scale; the title tracks it so the
       hierarchy holds at every card size. */
    --shared-prompt-title-font-size: var(--home-feed-content-font-size, 1.8rem);
    height: 100%;
    min-height: 0;
    gap: 0.5rem;
    padding: 0.9rem;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  /* Same design, smaller scale: the target panel and the inline embed tiles
     get a fraction of a full card's room. */
  &.compact {
    --shared-prompt-chip-font-size: max(1.02rem, 10.2px);
    --shared-prompt-chip-badge-size: 1.6rem;
    --shared-prompt-stat-font-size: max(1.02rem, 10.2px);
    --shared-prompt-title-font-size: max(1.5rem, 15px);
    --shared-prompt-instructions-font-size: max(1.25rem, 12.5px);
    --shared-prompt-title-max-lines: 2;
    --shared-prompt-instructions-padding: 0.55rem 0.6rem;
    --shared-prompt-instructions-radius: 0.8rem;
    --shared-prompt-instructions-flex: 0 0 auto;
    gap: 0.4rem;
    padding: 0.8rem;
    border-radius: 1.1rem;
  }

  &.compact.panel {
    padding: 0.75rem 0.8rem;
  }

  /* An inline tile sits in a slot far taller than a short prompt needs; hug the
     content instead of stretching the well into a big empty box. */
  &.compact:not(.panel) {
    height: auto;
    align-self: flex-start;
  }

  /* In a post's embed slot the frame belongs to the slot — the same grey
     border an image, comment or video embed gets there — so the block drops
     its own rather than drawing a second one. (The target-comment slot is the
     opposite: it strips its tiles' frames and lets each embed's own card show,
     so the block keeps its frame there.) */
  .home-feed-card__subject-embed-preview.home-feed-card__rich-embed-internal--shared-prompt
    & {
    border: 0;
    border-radius: 0;
    background: transparent;
  }
`;

const headerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-shrink: 0;

  .shared-prompt__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.28rem 0.8rem 0.28rem 0.32rem;
    border-radius: 999px;
    background: var(--shared-prompt-tint-strong);
    color: var(--shared-prompt-accent);
    font-family: var(--shared-prompt-mono);
    font-size: var(--shared-prompt-chip-font-size, 1.15rem);
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
  }

  .shared-prompt__chip-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--shared-prompt-chip-badge-size, 1.9rem);
    height: var(--shared-prompt-chip-badge-size, 1.9rem);
    border-radius: 999px;
    background: #fff;
    color: var(--shared-prompt-accent);
    font-size: 1.05rem;
  }
`;

const titleClass = css`
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: ${Color.black()};
  font: inherit;
  font-size: var(--shared-prompt-title-font-size, 1.8rem);
  font-weight: 900;
  line-height: 1.15;
  text-align: left;
  overflow-wrap: anywhere;
  flex-shrink: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--shared-prompt-title-max-lines, 3);
  overflow: hidden;

  &.clickable {
    cursor: pointer;
    &:hover {
      color: var(--shared-prompt-accent);
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    font-size: var(--shared-prompt-title-font-size, 1.6rem);
  }
`;

const metaClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const statsClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex-shrink: 0;

  .shared-prompt__stat {
    appearance: none;
    border: 0;
    font: inherit;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.26rem 0.66rem;
    border-radius: 999px;
    background: var(--shared-prompt-tint);
    color: var(--shared-prompt-accent);
    font-size: var(--shared-prompt-stat-font-size, 1.1rem);
    font-weight: 800;
    line-height: 1.1;
  }

  .shared-prompt__stat.clickable {
    cursor: pointer;
  }
`;

const instructionsClass = css`
  --rich-text-preview-ellipsis-bg: var(--shared-prompt-tint);
  position: relative;
  box-sizing: border-box;
  display: flex;
  min-height: 0;
  flex: var(--shared-prompt-instructions-flex, 1 1 auto);
  gap: 0.55rem;
  padding: var(--shared-prompt-instructions-padding, 0.9rem 0.95rem);
  border: 1px solid var(--shared-prompt-border);
  border-radius: var(--shared-prompt-instructions-radius, 1.1rem);
  background: var(--shared-prompt-tint);
  color: ${Color.darkerGray()};
  font-family: var(--shared-prompt-mono);
  font-size: var(
    --shared-prompt-instructions-font-size,
    var(--home-feed-question-font-size, 1.4rem)
  );
  font-weight: 400;
  line-height: 1.45;
  overflow: hidden;

  /* RichText and the plain-text previews both render inside; neither may
     reintroduce the body font. */
  p,
  li,
  span,
  strong,
  em,
  div {
    font-family: inherit;
  }

  .shared-prompt__instructions-body {
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .shared-prompt__instructions-body > div {
    min-height: 0;
  }
`;

const footerClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  /* Center the action row itself, not just its contents, so a single target
     sits in the middle instead of hugging the left edge. */
  > * {
    justify-content: center;
  }
`;
