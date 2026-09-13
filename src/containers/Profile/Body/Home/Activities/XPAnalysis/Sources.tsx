import React, { useId } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  formatShare,
  formatXP,
  getSourceBreakdown,
  type XPSource
} from './helpers/data';
import { captionClass, cardClass, headingClass } from './styles';

const colors = new Map([
  ['writing', Color.logoBlue()],
  ['watching', Color.passionFruit()],
  ['vocabulary', Color.orange()],
  ['missions', Color.green()],
  ['grammar', Color.purple()],
  ['cards', Color.magenta()],
  ['ai story', Color.gold()],
  ['daily bonus', Color.skyBlue()],
  ['chess puzzles', Color.brown()],
  ['lumine apps', Color.darkCyan()]
]);

export default function Sources({ data }: { data: XPSource[] }) {
  const headingId = useId();
  const sources = getSourceBreakdown(data);
  const hasAdjustments = sources.some(({ value }) => value < 0);

  return (
    <section
      className={`${cardClass} ${sourcesClass}`}
      aria-labelledby={headingId}
    >
      <div className={headingClass}>
        <h3 id={headingId}>XP sources</h3>
        <span className={captionClass}>All time</span>
      </div>
      {sources.length > 0 && (
        <div className="source-strip" aria-hidden="true">
          {sources.map(({ name, share }) => (
            <span
              key={name}
              style={{
                width: `${share}%`,
                background: colors.get(name) || '#94a3b8'
              }}
            />
          ))}
        </div>
      )}
      <div
        className="source-scroll"
        role="region"
        aria-label="All-time XP sources"
        tabIndex={0}
      >
        {sources.length > 0 ? (
          <>
            <ul className="source-list">
              {sources.map(({ name, label, value, share }) => (
                <li key={name}>
                  <div className="source-row">
                    <div className="source-label">
                      <span
                        className="source-dot"
                        style={{ background: colors.get(name) || '#94a3b8' }}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </div>
                    <span className="source-value">
                      {formatXP(value)} <span>XP</span>
                    </span>
                    <span
                      className="source-share"
                      aria-label={value < 0 ? 'Adjustment' : undefined}
                    >
                      {value < 0 ? '—' : formatShare(share)}
                    </span>
                  </div>
                  <div className="source-track" aria-hidden="true">
                    <div
                      style={{
                        width: `${share}%`,
                        background: colors.get(name) || '#94a3b8'
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {hasAdjustments && (
              <p className={captionClass}>
                Shares show positive XP. Adjustments include revoked rewards.
              </p>
            )}
          </>
        ) : (
          <p className={captionClass}>
            No XP sources yet. XP earned from activities and Lumine apps will
            appear here.
          </p>
        )}
      </div>
    </section>
  );
}

const sourcesClass = css`
  /* Only Monthly growth contributes to the grid's row height, including
     when the cards stack. The source list uses the remaining space. */
  contain: size;
  min-height: 0;
  display: flex;
  flex-direction: column;
  > div:first-child {
    flex-shrink: 0;
  }
  .source-scroll {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
    scrollbar-gutter: stable;
    margin-right: -0.8rem;
    padding-right: 0.8rem;
    &:focus-visible {
      outline: 2px solid var(--xp-focus);
      outline-offset: -2px;
      border-radius: 4px;
    }
  }
  .source-strip {
    flex-shrink: 0;
    display: flex;
    height: 0.8rem;
    overflow: hidden;
    border-radius: 999px;
    margin-bottom: 1.8rem;
    background: #f1f5f9;
    span {
      height: 100%;
    }
  }
  .source-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    padding: 1rem 0;
  }
  li:first-child {
    padding-top: 0;
  }
  li + li {
    border-top: 1px solid #f1f5f9;
  }
  .source-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto max(38px, 4.6rem);
    align-items: baseline;
    gap: 0.8rem;
  }
  .source-label {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-size: max(13px, 1.4rem);
    font-weight: 600;
  }
  .source-dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .source-share {
    text-align: right;
    font-size: max(11px, 1.1rem);
    font-weight: 400;
    color: var(--xp-muted);
    white-space: nowrap;
  }
  .source-track {
    margin: 0.6rem 0 0 1.4rem;
    height: 0.3rem;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }
  .source-track > div {
    height: 100%;
    border-radius: inherit;
  }
  .source-value {
    text-align: right;
    font-size: max(12px, 1.2rem);
    font-weight: 600;
    white-space: nowrap;
  }
  .source-value > span {
    font-size: max(11px, 1.1rem);
    font-weight: 400;
    color: var(--xp-muted);
  }
`;
