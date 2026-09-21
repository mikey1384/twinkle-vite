import React, {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { createPortal } from 'react-dom';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { mobileMaxWidth } from '~/constants/css';
import {
  MAX_BUILD_APP_REFERENCES,
  type BuildAppReference
} from '../helpers/appReferences';
import useReferenceAppSearch from './hooks/useReferenceAppSearch';

export default function AppReferencePicker({
  buildId,
  anchorRef,
  selectedApps,
  onSelect,
  onClose
}: {
  buildId: number;
  anchorRef: RefObject<HTMLButtonElement | null>;
  selectedApps: BuildAppReference[];
  onSelect: (app: BuildAppReference) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const {
    search,
    apps,
    cursor,
    loading,
    loadingMore,
    error,
    changeSearch,
    loadMore,
    retry
  } = useReferenceAppSearch(buildId);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const anchor = anchorRef.current;
    const viewport = window.visualViewport;
    let frame = 0;
    function updatePosition() {
      frame = 0;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const offsetTop = viewport?.offsetTop || 0;
      const offsetLeft = viewport?.offsetLeft || 0;
      if (window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches) {
        setPosition({
          left: offsetLeft,
          bottom: Math.max(0, window.innerHeight - height - offsetTop),
          width,
          maxHeight: Math.floor(height * 0.88)
        });
      } else {
        const rect = anchor?.getBoundingClientRect();
        const panelWidth = Math.min(400, width - 24);
        const above = (rect?.top || height) - offsetTop - 20;
        const below = height + offsetTop - (rect?.bottom || 0) - 20;
        const openAbove = above >= Math.min(360, below);
        setPosition({
          left: Math.max(
            offsetLeft + 12,
            Math.min(rect?.left || 12, offsetLeft + width - panelWidth - 12)
          ),
          ...(openAbove
            ? { bottom: window.innerHeight - (rect?.top || height) + 8 }
            : { top: (rect?.bottom || offsetTop) + 8 }),
          width: panelWidth,
          maxHeight: Math.max(160, Math.min(480, openAbove ? above : below))
        });
      }
    }
    function schedulePosition() {
      if (!frame) frame = window.requestAnimationFrame(updatePosition);
    }
    updatePosition();
    dialog.showModal();
    if (window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches)
      closeRef.current?.focus();
    else searchRef.current?.focus();
    const observer = new ResizeObserver(schedulePosition);
    if (anchor) observer.observe(anchor);
    window.addEventListener('resize', schedulePosition);
    window.addEventListener('scroll', schedulePosition, true);
    viewport?.addEventListener('resize', schedulePosition);
    viewport?.addEventListener('scroll', schedulePosition);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedulePosition);
      window.removeEventListener('scroll', schedulePosition, true);
      viewport?.removeEventListener('resize', schedulePosition);
      viewport?.removeEventListener('scroll', schedulePosition);
      dialog.close();
      anchor?.focus({ preventScroll: true });
    };
  }, [anchorRef]);

  return createPortal(
    <dialog
      ref={dialogRef}
      id={`build-app-reference-picker-${buildId}`}
      aria-labelledby="app-reference-title"
      aria-describedby="app-reference-description"
      className={pickerClass}
      style={position}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="app-reference-handle" aria-hidden />
      <header>
        <div className="app-reference-heading">
          <h2 id="app-reference-title">Reference an app</h2>
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close app picker"
          >
            <Icon icon="xmark" />
          </button>
        </div>
        <p id="app-reference-description">
          Choose an app for Lumine to learn from.
        </p>
        <label className="app-reference-search">
          <Icon icon="magnifying-glass" />
          <input
            ref={searchRef}
            aria-label="Search your apps"
            type="search"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search your apps"
            maxLength={160}
            autoComplete="off"
          />
        </label>
      </header>
      <div className="app-reference-list-label">
        {search.trim() ? 'Search results' : 'Recently updated'}
      </div>
      <div
        className="app-reference-results"
        aria-busy={loading || loadingMore}
        onScroll={(event) => {
          const node = event.currentTarget;
          if (
            !error &&
            node.scrollHeight - node.scrollTop - node.clientHeight < 80
          )
            loadMore();
        }}
      >
        {loading ? (
          <p className="app-reference-notice" role="status">
            Loading your apps…
          </p>
        ) : (
          apps.map((app) => {
            const selected = selectedApps.some((entry) => entry.id === app.id);
            return (
              <button
                type="button"
                className="app-reference-row"
                key={app.id}
                disabled={
                  selected || selectedApps.length >= MAX_BUILD_APP_REFERENCES
                }
                aria-label={`${app.title}, ${app.relationship === 'own' ? 'your app' : `team app by ${app.username}`}${selected ? ', already added' : ''}`}
                onClick={() => onSelect(app)}
              >
                <span className="app-reference-thumbnail">
                  {app.thumbnailUrl ? (
                    <img src={app.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <Icon icon="cubes" />
                  )}
                </span>
                <span className="app-reference-info">
                  <strong>{app.title}</strong>
                  <span>
                    {app.relationship === 'own'
                      ? 'Your app'
                      : `Team app${app.username ? ` · ${app.username}` : ''}`}
                  </span>
                </span>
                <Icon icon={selected ? 'check' : 'plus'} />
              </button>
            );
          })
        )}
        {!loading && !error && !apps.length ? (
          <p className="app-reference-notice">
            {search.trim()
              ? 'No matching apps. Try another name.'
              : 'Your other apps and team apps will appear here.'}
          </p>
        ) : null}
        {error ? (
          <div className="app-reference-notice" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="app-reference-retry"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : null}
        {!loading && cursor && !error ? (
          <LoadMoreButton
            variant="ghost"
            style={{ fontSize: '1.2rem', width: '100%', margin: '0.5rem 0' }}
            loading={loadingMore}
            onClick={loadMore}
          />
        ) : null}
      </div>
      <footer>Your apps and team apps · Up to 2 per message</footer>
    </dialog>,
    document.body
  );
}

const enter = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;
const pickerClass = css`
  position: fixed;
  margin: 0;
  padding: 0;
  inset: auto;
  max-width: none;
  border: 1px solid #d4deed;
  border-radius: 14px;
  background: #fff;
  color: #283348;
  box-shadow: 0 15px 50px rgba(24, 44, 75, 0.2);
  overflow: hidden;
  font-size: 1.2rem;
  animation: ${enter} 0.16s ease;
  &[open] {
    display: flex;
    flex-direction: column;
  }
  &::backdrop {
    background: transparent;
  }
  .app-reference-handle {
    display: none;
  }
  header {
    padding: 1.4rem 1.4rem 1.1rem;
    flex-shrink: 0;
  }
  .app-reference-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 750;
  }
  .app-reference-heading button {
    display: grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #7c899d;
    cursor: pointer;
  }
  header p {
    margin: 0.3rem 0 1.1rem;
    font-size: 1.1rem;
    color: #788597;
  }
  .app-reference-search {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid #d9e1ed;
    border-radius: 8px;
    background: #f9fbfe;
    color: #8b99ae;
  }
  .app-reference-search:focus-within {
    border-color: #7aa7f2;
    box-shadow: 0 0 0 2px #3677f510;
  }
  input {
    width: 100%;
    min-width: 0;
    background: transparent;
    border: 0;
    outline: none;
    font: inherit;
    color: #2b3c55;
  }
  .app-reference-list-label {
    padding: 0 1.5rem 0.6rem;
    font-size: 1rem;
    font-weight: 700;
    color: #8b96a5;
  }
  .app-reference-results {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 0.6rem 0.6rem;
  }
  .app-reference-row {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    padding: 0.9rem;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .app-reference-row:hover:not(:disabled) {
    background: #eff5ff;
  }
  .app-reference-row:disabled {
    opacity: 0.48;
    cursor: default;
  }
  .app-reference-row > svg {
    color: #8598b5;
    margin-left: auto;
    flex-shrink: 0;
  }
  .app-reference-thumbnail {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    height: 3.5rem;
    width: 3.5rem;
    border-radius: 8px;
    overflow: hidden;
    background: #edf3fe;
    color: #6e91cd;
    font-size: 1.5rem;
  }
  .app-reference-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .app-reference-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }
  .app-reference-info strong {
    font-size: 1.2rem;
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .app-reference-info > span {
    font-size: 1rem;
    color: #8190a4;
    overflow-wrap: anywhere;
  }
  .app-reference-notice {
    padding: 1.5rem 1rem;
    text-align: center;
    font-size: 1.1rem;
    color: #73829a;
  }
  .app-reference-notice p {
    margin: 0 0 0.75rem;
  }
  .app-reference-retry {
    border: 0;
    background: transparent;
    color: #3677df;
    font: inherit;
    font-weight: 650;
    cursor: pointer;
  }
  footer {
    flex-shrink: 0;
    padding: 1rem 1.4rem;
    border-top: 1px solid #edf0f5;
    color: #8b97aa;
    font-size: 1rem;
  }
  button:focus-visible {
    outline: 2px solid #75a3f6;
    outline-offset: -2px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    border: 0;
    border-radius: 20px 20px 0 0;
    &::backdrop {
      background: rgba(22, 35, 59, 0.35);
    }
    .app-reference-handle {
      display: block;
      flex-shrink: 0;
      width: 3rem;
      height: 4px;
      margin: 1rem auto 0;
      border-radius: 2px;
      background: #d8dde7;
    }
    header {
      padding: 1.2rem 1.6rem;
    }
    h2 {
      font-size: 1.6rem;
    }
    input {
      font-size: 16px;
    }
    .app-reference-row {
      padding: 1.1rem;
    }
    .app-reference-info strong {
      font-size: 1.3rem;
    }
    .app-reference-info > span {
      font-size: 1.1rem;
    }
    footer {
      padding: 1.2rem 1.6rem max(1.8rem, env(safe-area-inset-bottom));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
