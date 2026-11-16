import React, { useCallback, useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { borderRadius, innerBorderRadius, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  AI_IMAGE_COLLECTIONS_COMBINE_MAX,
  type AIImageCollection
} from '~/helpers/aiImageHistory';
import CollectionThumbs from './CollectionThumbs';

const RECENT_SHOWN = 3;

// The same control as the Zero/Ciel topic bar (Chat ChannelHeader/ChatFilter/
// Bar.tsx), on one row:
// - each picked collection (up to three used together, v2) is a highlighted
//   segment in the chat-topic colour with its pictures and a ✕, and the
//   last button opens the Collections window (a plus while another fits);
// - otherwise the member's most recent collections are chips (pictures and
//   name; one tap picks it) and "▾ All" opens the Collections window;
// - with none yet, one inviting tile opens the window's start form.
// On a phone the chips scroll sideways, with a fade on the right edge while
// more are hidden (the comment ActionRow pattern).
export default function CollectionBar({
  activeCollections,
  collections,
  invitePictures = [],
  disabled,
  themeColor,
  onOpen,
  onPick,
  onClear
}: {
  // the picked collections, in order
  activeCollections: AIImageCollection[];
  // the member's collections, most recent first; null until known
  collections: AIImageCollection[] | null;
  // a few of the member's own pictures for the "make one" tile
  invitePictures?: { id: number; path: string }[];
  disabled?: boolean;
  themeColor?: string;
  onOpen: () => void;
  onPick: (collection: AIImageCollection) => void;
  // stop using this one
  onClear: (id: number) => void;
}) {
  const normalizedTheme = themeColor || 'logoBlue';
  const { color: topicColor, themeName } = useRoleColor('chatTopic', {
    themeName: normalizedTheme,
    fallback: normalizedTheme
  });
  const { color: topicTextColor } = useRoleColor('chatTopicText', {
    themeName,
    fallback: 'white'
  });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  const recent = (collections || []).slice(0, RECENT_SHOWN);

  const measure = useCallback(() => {
    const row = scrollerRef.current;
    if (!row) return;
    const left = row.scrollLeft > 2;
    const right = row.scrollLeft + row.clientWidth < row.scrollWidth - 2;
    setMore((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right }
    );
  }, []);

  useEffect(() => {
    measure();
    const row = scrollerRef.current;
    if (!row || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    Array.from(row.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [measure, recent.length, activeCollections.length]);

  if (activeCollections.length) {
    const canAddMore =
      activeCollections.length < AI_IMAGE_COLLECTIONS_COMBINE_MAX &&
      (collections || []).length > activeCollections.length;
    return (
      <div className={barCls} aria-disabled={disabled || undefined}>
        <div
          ref={scrollerRef}
          className={scrollerCls}
          data-more-left={more.left}
          data-more-right={more.right}
          onScroll={measure}
        >
          {activeCollections.map((collection) => (
            <div
              key={collection.id}
              className={activeCls}
              data-several={activeCollections.length > 1}
              style={{ background: topicColor, color: topicTextColor }}
              title={collection.name}
            >
              <button
                type="button"
                className={segmentCls}
                disabled={disabled}
                onClick={onOpen}
                aria-label={`Using collection ${collection.name}. Change collections`}
              >
                <CollectionThumbs images={collection.images} size={30} />
                <span className="name">{collection.name}</span>
              </button>
              <button
                type="button"
                className={clearCls}
                disabled={disabled}
                onClick={() => onClear(collection.id)}
                aria-label={`Stop using ${collection.name}`}
                title="Stop using this collection"
              >
                <Icon icon="times" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={openCls}
          disabled={disabled}
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={canAddMore ? 'Add another collection' : 'All collections'}
          title={canAddMore ? 'Add another collection' : 'All collections'}
        >
          <Icon icon={canAddMore ? 'plus' : 'caret-down'} />
        </button>
      </div>
    );
  }

  if (collections && !collections.length) {
    return (
      <div className={barCls} aria-disabled={disabled || undefined}>
        <button
          type="button"
          className={`${segmentCls} ${inviteCls}`}
          disabled={disabled}
          onClick={onOpen}
          aria-haspopup="dialog"
        >
          <span className="faint">
            <CollectionThumbs images={invitePictures} size={26} />
          </span>
          <span className="name">
            <b>Make a collection:</b> teach the AI your characters, style or
            world once
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={barCls} aria-disabled={disabled || undefined}>
      {recent.length > 0 && (
        <div
          ref={scrollerRef}
          className={scrollerCls}
          data-more-left={more.left}
          data-more-right={more.right}
          onScroll={measure}
        >
          {recent.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={`${segmentCls} ${chipCls}`}
              disabled={disabled}
              onClick={() => onPick(collection)}
              title={collection.name}
              aria-label={`Use collection ${collection.name}`}
              style={{ ['--chip-hover' as any]: topicColor }}
            >
              <CollectionThumbs images={collection.images} size={26} />
              <span className="name">{collection.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={openCls}
        disabled={disabled}
        onClick={onOpen}
        aria-haspopup="dialog"
      >
        <Icon icon="caret-down" />
        <span className="label">{recent.length ? 'All' : 'Collections'}</span>
      </button>
    </div>
  );
}

const barCls = css`
  display: flex;
  align-items: center;
  align-self: center;
  max-width: min(100%, 60rem);
  min-width: 0;
  height: 4rem;
  font-size: 1.4rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  box-shadow: 0 12px 20px -16px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  &[aria-disabled='true'] {
    opacity: 0.55;
  }
  button {
    font: inherit;
    color: inherit;
    background: transparent;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:disabled {
    cursor: not-allowed;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.25rem;
    border-radius: ${innerBorderRadius};
  }
`;

const scrollerCls = css`
  display: flex;
  align-items: center;
  height: 100%;
  min-width: 0;
  flex: 1 1 auto;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  &[data-more-right='true'] {
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 4rem), transparent);
    mask-image: linear-gradient(to right, #000 calc(100% - 4rem), transparent);
  }
  &[data-more-left='true'][data-more-right='true'] {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 4rem), transparent);
    mask-image: linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 4rem), transparent);
  }
  &[data-more-left='true']:not([data-more-right='true']) {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 3rem);
    mask-image: linear-gradient(to right, transparent, #000 3rem);
  }
`;

const segmentCls = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  height: 100%;
  min-width: 0;
  padding: 0 1rem 0 0.7rem;
  font-weight: bold;
  .name {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const chipCls = css`
  flex: 0 0 auto;
  max-width: 18rem;
  transition:
    background 0.18s ease,
    color 0.18s ease;
  & + & {
    border-left: 1px solid var(--ui-border) !important;
  }
  &:hover:not(:disabled) {
    background: var(--chip-hover);
    color: #fff;
  }
`;

const inviteCls = css`
  font-weight: normal;
  color: #526176 !important;
  .faint {
    display: inline-flex;
    opacity: 0.5;
  }
  b {
    color: #273449;
  }
  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.03);
  }
`;

const activeCls = css`
  display: flex;
  align-items: center;
  height: 100%;
  min-width: 0;
  flex: 1 1 auto;
  animation: collectionSegmentIn 0.2s ease both;
  @keyframes collectionSegmentIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  &[data-several='true'] {
    flex: 0 0 auto;
    max-width: 20rem;
  }
  & + & {
    border-left: 1px solid rgba(255, 255, 255, 0.45);
  }
`;

const clearCls = css`
  height: 100%;
  flex: 0 0 auto;
  padding: 0 1rem;
  opacity: 0.85;
  &:hover:not(:disabled) {
    opacity: 1;
  }
`;

const openCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 0 0 auto;
  padding: 0 1.2rem;
  font-weight: bold;
  white-space: nowrap;
  border-left: 1px solid var(--ui-border) !important;
  &:first-child {
    border-left: 0 !important;
  }
  &:hover:not(:disabled) {
    color: #007bff;
  }
  .label {
    margin-left: 0.8rem;
  }
`;
