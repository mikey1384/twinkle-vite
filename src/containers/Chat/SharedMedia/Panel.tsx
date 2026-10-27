import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Thumbnail from './Thumbnail';
import type {
  SharedAttachment,
  SharedMediaKind
} from '~/helpers/chatSharedMedia';

export default function SharedMediaPanel({
  items,
  loading,
  error,
  onOpen,
  onSelect,
  autoFill = false,
  nextCursor = null,
  onNeedMore
}: {
  items: SharedAttachment[];
  loading: boolean;
  error: string;
  onOpen: (kind: SharedMediaKind) => void;
  onSelect: (item: SharedAttachment) => void;
  autoFill?: boolean;
  nextCursor?: number | null;
  onNeedMore?: () => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLButtonElement>(null);
  const filledCursors = useRef(new Set<number>());
  const [space, setSpace] = useState({
    width: 0,
    height: 0,
    rowHeight: 36,
    columns: 3
  });
  useLayoutEffect(() => {
    const preview = previewRef.current;
    const footer = footerRef.current;
    if (!preview || !footer) return;
    function measure() {
      if (!preview || !footer) return;
      const box = preview.getBoundingClientRect();
      const next = {
        width: Math.max(0, box.width - 4),
        height: Math.max(0, box.height - 4),
        rowHeight: footer.getBoundingClientRect().height,
        columns: matchMedia('(pointer: coarse)').matches ? 2 : 3
      };
      setSpace((current) =>
        Object.keys(next).every(
          (key) =>
            current[key as keyof typeof current] ===
            next[key as keyof typeof next]
        )
          ? current
          : next
      );
    }
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    observer.observe(footer);
    measure();
    return () => observer.disconnect();
  }, []);
  const media = items.filter(
    (item) => item.fileType === 'image' || item.fileType === 'video'
  );
  const files = items.filter(
    (item) => item.fileType !== 'image' && item.fileType !== 'video'
  );
  const tileHeight = Math.max(
    30,
    (space.width - (space.columns - 1) * 4) / space.columns
  );
  // Reserve roughly a third for files, then return unused space to either
  // kind. Only complete rows fit; the gallery is the place for scrolling.
  const fileBudget = Math.min(
    files.length,
    Math.max(1, Math.floor((space.height * 0.35) / space.rowHeight))
  );
  const mediaRows = Math.max(
    0,
    Math.floor(
      (space.height - fileBudget * space.rowHeight - (fileBudget ? 8 : 0) + 4) /
        (tileHeight + 4)
    )
  );
  const mediaCount = Math.min(media.length, mediaRows * space.columns);
  const gridHeight = mediaCount
    ? Math.ceil(mediaCount / space.columns) * (tileHeight + 4) - 4
    : 0;
  const fileCount = Math.min(
    files.length,
    Math.max(
      0,
      Math.floor(
        (space.height - gridHeight - (mediaCount ? 8 : 0)) / space.rowHeight
      )
    )
  );
  const spareHeight =
    space.height -
    gridHeight -
    (mediaCount && fileCount ? 8 : 0) -
    fileCount * space.rowHeight;
  const allShown = mediaCount === media.length && fileCount === files.length;
  useEffect(() => {
    // On an unusually tall sidebar, fill from at most two older pages. Never
    // crawl empty history automatically or fetch behind the open gallery.
    if (
      !autoFill ||
      !onNeedMore ||
      !nextCursor ||
      loading ||
      error ||
      !items.length ||
      !allShown ||
      spareHeight < Math.max(tileHeight, space.rowHeight) ||
      filledCursors.current.size >= 2 ||
      filledCursors.current.has(nextCursor)
    )
      return;
    filledCursors.current.add(nextCursor);
    onNeedMore();
  }, [
    autoFill,
    onNeedMore,
    nextCursor,
    loading,
    error,
    items.length,
    allShown,
    spareHeight,
    tileHeight,
    space.rowHeight
  ]);
  const recent = media.slice(0, mediaCount);
  const recentFiles = files.slice(0, fileCount);
  return (
    <section
      aria-label="Shared in this chat"
      className={css`
        display: flex;
        flex-direction: column;
        flex: 1 1 160px;
        min-height: 160px;
        margin: 14px 8px 0;
        padding-top: 14px;
        min-width: 0;
        border-top: 1px solid var(--chat-panel-border, #e2e8f0);
        color: var(--chat-panel-text, #334155);
        .media-preview {
          flex: 1 1 0;
          min-height: 0;
          overflow: hidden;
          padding: 2px;
        }
        h3 {
          flex: 0 0 auto;
          font-size: max(11px, 1.1rem);
          font-weight: 650;
          line-height: 1.4;
          margin: 0 2px 8px;
        }
        button {
          font-family: inherit;
          cursor: pointer;
        }
        button:focus-visible {
          outline: 2px solid #418ceb;
          outline-offset: 2px;
        }
        .media-thumbs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 4px;
          margin: 0 0 8px;
        }
        .media-thumbs button {
          padding: 0;
          border: 0;
          border-radius: 6px;
          aspect-ratio: 1;
          min-width: 0;
          min-height: 30px;
        }
        .media-file {
          display: flex;
          gap: 6px;
          align-items: center;
          min-width: 0;
        }
        .media-file span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .media-row {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          border: 0;
          border-radius: 6px;
          flex: 0 0 auto;
          height: calc(36 * var(--px));
          min-height: 36px;
          padding: 7px 4px;
          text-align: left;
          font-size: max(11px, 1.1rem);
          background: transparent;
          color: inherit;
        }
        .media-row:hover {
          background: var(--chat-hover-bg, #f1f5f9);
        }
        .media-all {
          color: #2868ae;
          font-weight: 600;
          justify-content: space-between;
        }
        .media-mobile {
          display: none;
        }
        @media (max-width: 1023px), (max-height: 640px) {
          flex: 0 0 auto;
          min-height: 0;
          margin-top: 8px;
          padding-top: 6px;
          h3,
          .media-recent {
            display: none;
          }
          .media-mobile {
            display: inline;
          }
          .media-row {
            min-height: 44px;
          }
        }
        @media (pointer: coarse) {
          .media-thumbs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .media-row {
            min-height: 44px;
          }
        }
      `}
    >
      <h3>Shared in this chat</h3>
      <div ref={previewRef} className="media-recent media-preview">
        {recent.length > 0 && (
          <div className="media-thumbs">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Open ${item.name}`}
                onClick={() => onSelect(item)}
              >
                <Thumbnail item={item} />
              </button>
            ))}
          </div>
        )}
        {recentFiles.map((file) => (
          <button
            key={file.id}
            type="button"
            className="media-row media-file"
            onClick={() => onSelect(file)}
            title={file.name}
          >
            <Icon icon="file-alt" />
            <span>{file.name}</span>
          </button>
        ))}
        {!items.length && (
          <button
            type="button"
            className="media-row"
            onClick={() => onOpen('all')}
          >
            <Icon icon="images" />
            {loading ? 'Loading…' : error ? 'Try again' : 'Photos & files'}
          </button>
        )}
      </div>
      <button
        ref={footerRef}
        type="button"
        className="media-row media-all"
        onClick={() => onOpen('all')}
        aria-label="View all shared photos and files"
      >
        <span>
          <span className="media-mobile">Shared photos & files</span>
          <span className="media-recent">View all</span>
        </span>
        <Icon icon="chevron-right" />
      </button>
    </section>
  );
}
