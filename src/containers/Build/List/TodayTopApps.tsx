import React, { useId, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import type { TodayTopViewedBuild } from './types';
import { BUILD_TODAY_TOP_VIEW_SOURCE } from '../constants/runtimeViewSources';

const panelClass = css`
  min-width: 0;
  padding-left: 1.8rem;
  border-left: 1px solid rgba(65, 140, 235, 0.18);

  @container (max-width: 640px) {
    padding: 1.3rem 0 0;
    border-left: 0;
    border-top: 1px solid rgba(65, 140, 235, 0.18);
  }
`;

const headerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;

  h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    color: var(--chat-text);
    font-size: 1.3rem;
    line-height: 1.4;
    font-weight: 900;
  }
`;

const moreButtonClass = css`
  flex: 0 0 auto;
  min-height: 44px;
  margin: -0.7rem 0;
  padding: 0.5rem 0;
  border: 0;
  background: transparent;
  color: #245eaa;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const listClass = css`
  margin: 0.8rem 0 0;
  padding: 0;
  list-style: none;

  li + li {
    border-top: 1px solid var(--ui-border);
  }
`;

const rowClass = css`
  display: grid;
  grid-template-columns: 1.2rem 3.3rem minmax(0, 1fr) 0.7rem;
  align-items: center;
  gap: 0.7rem;
  min-height: 4.6rem;
  padding: 0.65rem 0;
  color: var(--chat-text);
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: #245eaa;
  }

  &:focus-visible {
    outline: 2px solid #418ceb;
    outline-offset: 2px;
    border-radius: 0.4rem;
  }
`;

const rankClass = css`
  font-size: 1.1rem;
  font-weight: 900;
  text-align: center;
  font-variant-numeric: tabular-nums;
  opacity: 0.72;
`;

const thumbnailClass = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.3rem;
  height: 3.3rem;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #edf4fd;
  color: #245eaa;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #edf4fd;
  }
`;

const copyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  line-height: 1.35;

  strong {
    font-size: 1.25rem;
    overflow-wrap: anywhere;
  }

  span {
    font-size: 1.1rem;
    opacity: 0.72;
    overflow-wrap: anywhere;
  }
`;

const statusClass = css`
  margin: 1rem 0 0;
  color: var(--chat-text);
  font-size: 1.1rem;
  line-height: 1.5;
  opacity: 0.76;
`;

export default function TodayTopApps({
  builds,
  pending,
  failed,
  onOpen,
  onRetry
}: {
  builds: TodayTopViewedBuild[];
  pending: boolean;
  failed: boolean;
  onOpen: (build: TodayTopViewedBuild) => void;
  onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const titleId = useId();
  const visibleBuilds = expanded ? builds : builds.slice(0, 3);

  return (
    <section
      className={panelClass}
      aria-labelledby={titleId}
      aria-busy={pending}
    >
      <header className={headerClass}>
        <h2 id={titleId}>
          <Icon icon="trophy" />
          Today’s top
        </h2>
        {builds.length > 3 && (
          <button
            type="button"
            className={moreButtonClass}
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show less' : 'See all'}
          </button>
        )}
      </header>
      {visibleBuilds.length > 0 ? (
        <ol
          className={listClass}
          id={listId}
          aria-label="Apps ranked by today's unique views"
        >
          {visibleBuilds.map((build, index) => (
            <li key={build.id}>
              <a
                className={rowClass}
                href={`/app/${build.id}?viewSource=${BUILD_TODAY_TOP_VIEW_SOURCE}`}
                onClick={(event) => handleOpen(event, build)}
              >
                <span className={rankClass} aria-label={`Rank ${index + 1}`}>
                  {index + 1}
                </span>
                <span className={thumbnailClass} aria-hidden="true">
                  <Icon icon="laptop-code" />
                  {build.thumbnailUrl && (
                    <img
                      key={build.thumbnailUrl}
                      src={build.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  )}
                </span>
                <span className={copyClass}>
                  <strong>{build.title || 'Untitled Build'}</strong>
                  {build.username && <span>by {build.username}</span>}
                </span>
                <Icon icon="chevron-right" />
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <div className={statusClass} role="status">
          {pending
            ? 'Loading today’s top apps…'
            : failed
              ? 'Today’s top apps couldn’t load.'
              : 'Today’s top apps will appear as people open them.'}
          {failed && !pending && (
            <div>
              <button
                type="button"
                className={moreButtonClass}
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );

  function handleOpen(
    event: React.MouseEvent<HTMLAnchorElement>,
    build: TodayTopViewedBuild
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    onOpen(build);
  }
}
