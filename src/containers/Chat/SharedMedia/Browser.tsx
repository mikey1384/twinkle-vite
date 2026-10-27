import React, { useLayoutEffect, useRef } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Thumbnail from './Thumbnail';
import { chatTopicModalClass } from '../Modals/topicStyles';
import {
  attachmentDate,
  attachmentSize,
  type SharedAttachment,
  type SharedMediaKind,
  type SharedMediaPage
} from '~/helpers/chatSharedMedia';

export const sharedMediaModalClass = cx(
  chatTopicModalClass,
  css`
    width: min(94vw, calc(920 * var(--px)));
    border-radius: 14px;
    height: min(84dvh, calc(780 * var(--px)));
    > div:first-child > div {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    @media (max-width: 600px) {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 0;
    }
  `
);

export default function SharedMediaBrowser({
  channelName,
  page,
  loading,
  error,
  kind,
  topicId,
  currentTopic,
  pendingId,
  onKind,
  onTopic,
  onSelect,
  onClose,
  onMore,
  onRetry
}: {
  channelName: string;
  page: SharedMediaPage;
  loading: boolean;
  error: string;
  kind: SharedMediaKind;
  topicId: number;
  currentTopic?: { id: number; title: string };
  pendingId: number | null;
  onKind: (kind: SharedMediaKind) => void;
  onTopic: (id: number) => void;
  onSelect: (item: SharedAttachment) => void;
  onClose: () => void;
  onMore: () => void;
  onRetry: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scrollport = contentRef.current?.parentElement;
    if (scrollport) scrollport.scrollTop = 0;
  }, [kind, topicId]);
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Shared in this chat"
      aria-label="Shared in this chat"
      size="fullscreen"
      bodyPadding="0"
      className={sharedMediaModalClass}
    >
      <div
        ref={contentRef}
        className={css`
          width: 100%;
          min-width: 0;
          color: #273449;
          font-size: calc(14 * var(--px));
          line-height: 1.5;
          .media-tools {
            position: sticky;
            top: 0;
            z-index: 1;
            padding: 0 24px 16px;
            background: white;
            border-bottom: 1px solid #e9edf2;
          }
          .media-channel {
            margin: 0 0 14px;
            color: #64748b;
            overflow-wrap: anywhere;
          }
          .media-filters {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
          }
          .media-tabs {
            display: flex;
            padding: 3px;
            background: #f1f5f9;
            border-radius: 10px;
            max-width: 100%;
          }
          .media-tabs button {
            min-height: 40px;
            padding: 6px 14px;
            border: 0;
            border-radius: 7px;
            font: inherit;
            font-weight: 600;
            white-space: nowrap;
            color: #64748b;
            background: transparent;
            cursor: pointer;
          }
          .media-tabs button[aria-pressed='true'] {
            background: #fff;
            color: #245d9f;
            box-shadow: 0 1px 4px #1720331a;
          }
          .media-topic {
            display: flex;
            gap: 8px;
            align-items: center;
            max-width: 100%;
          }
          select {
            max-width: 220px;
            min-width: 0;
            min-height: 44px;
            font: inherit;
            border: 1px solid #d8e0e9;
            border-radius: 8px;
            padding: 6px 10px;
            background: white;
          }
          button:focus-visible,
          select:focus-visible {
            outline: 2px solid #418ceb;
            outline-offset: 2px;
          }
          .media-results {
            padding: 20px 24px 24px;
          }
          .media-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 20px 14px;
          }
          .media-card {
            min-width: 0;
            text-align: left;
            border: 0;
            background: transparent;
            padding: 0;
            cursor: pointer;
            color: inherit;
            font: inherit;
            border-radius: 10px;
          }
          .media-card:hover .media-picture {
            box-shadow: 0 0 0 2px #418ceb;
          }
          .media-picture {
            display: block;
            width: 100%;
            aspect-ratio: 1.2;
            border-radius: 10px;
            font-size: 28px;
          }
          .media-name {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
            margin-top: 8px;
          }
          .media-meta {
            color: #64748b;
            font-size: calc(12 * var(--px));
            overflow-wrap: anywhere;
          }
          .media-meta span {
            display: block;
          }
          .media-file {
            width: 100%;
            display: grid;
            grid-template-columns: 44px minmax(0, 1fr) auto;
            gap: 14px;
            align-items: center;
            text-align: left;
            border: 0;
            border-bottom: 1px solid #e9edf2;
            background: transparent;
            padding: 14px 4px;
            font: inherit;
            cursor: pointer;
            color: inherit;
          }
          .media-file:hover {
            background: #f8fafc;
          }
          .media-file .media-name {
            margin-top: 0;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .media-file-icon {
            height: 48px;
            border-radius: 9px;
            color: #64748b;
          }
          .media-file .media-meta span {
            display: inline;
          }
          .media-file .media-meta span + span::before {
            content: ' · ';
          }
          .media-empty {
            padding: 60px 16px;
            text-align: center;
            color: #64748b;
          }
          .media-empty strong {
            display: block;
            margin: 16px 0 6px;
            color: #273449;
            font-size: calc(16 * var(--px));
          }
          .media-empty p {
            margin: 0;
          }
          .media-status {
            text-align: center;
            padding: 20px 0 0;
          }
          @media (max-width: 600px) {
            .media-tools {
              padding: 0 16px 12px;
            }
            .media-results {
              padding: 16px;
            }
            .media-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 20px 12px;
            }
            .media-tabs {
              width: 100%;
            }
            .media-tabs button {
              flex: 1;
              padding: 6px 10px;
              min-height: 44px;
            }
            .media-topic,
            select {
              width: 100%;
              max-width: none;
            }
          }
        `}
      >
        <div className="media-tools">
          <p className="media-channel">{channelName}</p>
          <div className="media-filters">
            <div
              className="media-tabs"
              role="group"
              aria-label="Attachment type"
            >
              {(
                [
                  ['all', 'All'],
                  ['media', 'Photos & videos'],
                  ['files', 'Files']
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={kind === value}
                  onClick={() => onKind(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {currentTopic && (
              <label className="media-topic">
                <select
                  aria-label="Filter shared attachments by topic"
                  value={topicId}
                  onChange={(event) => onTopic(Number(event.target.value))}
                >
                  <option value={0}>All topics</option>
                  <option value={currentTopic.id}>
                    {currentTopic.title || 'Current topic'}
                  </option>
                </select>
              </label>
            )}
          </div>
        </div>
        <div className="media-results" aria-busy={loading}>
          {!page.items.length && !loading && !error && (
            <div className="media-empty">
              <Icon
                icon={kind === 'files' ? 'folder-open' : 'images'}
                size="2x"
              />
              <strong>
                {page.nextCursor
                  ? 'Nothing in recent messages'
                  : 'Nothing shared here yet'}
              </strong>
              <p>
                {page.nextCursor
                  ? 'Look further back in this conversation.'
                  : topicId
                    ? 'Try all topics, or share an attachment in this topic.'
                    : 'Photos, videos and files shared in this chat will appear here.'}
              </p>
            </div>
          )}
          <div className={kind === 'files' ? 'media-list' : 'media-grid'}>
            {page.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={kind === 'files' ? 'media-file' : 'media-card'}
                onClick={() => onSelect(item)}
                disabled={pendingId !== null}
                aria-label={`Open ${item.name}, shared by ${item.username}`}
              >
                <span
                  className={
                    kind === 'files' ? 'media-file-icon' : 'media-picture'
                  }
                >
                  <Thumbnail item={item} />
                </span>
                <span>
                  <span className="media-name">{item.name}</span>
                  <span className="media-meta">
                    <span>{item.username}</span>
                    <span>
                      {attachmentDate(item.timeStamp)}
                      {kind === 'files' && item.size
                        ? ` · ${attachmentSize(item.size)}`
                        : ''}
                    </span>
                  </span>
                </span>
                {kind === 'files' && <Icon icon="chevron-right" />}
              </button>
            ))}
          </div>
          {pendingId !== null && (
            <div className="media-status" role="status">
              <Icon icon="spinner" pulse /> Opening attachment…
            </div>
          )}
          <div className="media-status">
            {error && <p role="alert">{error}</p>}
            {loading ? (
              <span role="status">
                <Icon icon="spinner" pulse /> Loading attachments…
              </span>
            ) : error ? (
              <Button variant="soft" uppercase={false} onClick={onRetry}>
                Try again
              </Button>
            ) : page.nextCursor ? (
              <Button variant="soft" uppercase={false} onClick={onMore}>
                {page.items.length ? 'Load older' : 'Search older messages'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
