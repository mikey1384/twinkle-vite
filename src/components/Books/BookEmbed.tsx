import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { type BookPreview } from '~/helpers/bookEmbedHelpers';
import { saveScrollAnchorForElement } from '~/helpers/hooks/useScrollAnchorRestoration';

// RichText can measure an invisible copy at the same time as the visible one.
// Share in-flight reads, but don't retain metadata after requests settle.
const pending = new Map<number, Promise<{ book: BookPreview | null }>>();

export default function BookEmbed({
  subjectId,
  path = `/app/884/${subjectId}`,
  compact = false
}: {
  subjectId: number;
  path?: string;
  compact?: boolean;
}) {
  const loadBookPreview = useAppContext(
    (v) => v.requestHelpers.loadBookPreview
  );
  const [result, setResult] = useState<{
    id: number;
    book?: BookPreview | null;
    failed?: boolean;
  } | null>(null);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const current = result?.id === subjectId ? result : null;
  const book = current?.book;
  const loading = !current;
  const unavailable = current?.book === null;
  const cover =
    book?.coverUrl && book.coverUrl !== failedCover ? book.coverUrl : null;

  useEffect(() => {
    let active = true;
    setResult(null);
    let request = pending.get(subjectId);
    if (!request) {
      request = Promise.resolve().then(() => loadBookPreview(subjectId));
      pending.set(subjectId, request);
      void request
        .finally(() => {
          if (pending.get(subjectId) === request) pending.delete(subjectId);
        })
        .catch(() => {});
    }
    request
      .then((data) => {
        if (!data || (data.book !== null && data.book?.subjectId !== subjectId))
          throw new Error('Invalid book preview');
        if (active) setResult({ id: subjectId, book: data.book });
      })
      .catch(() => {
        if (active) setResult({ id: subjectId, failed: true });
      });
    return () => {
      active = false;
    };
    // Request helpers are context services, not reactive inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, retry]);

  if (unavailable || current?.failed) {
    return (
      <div className={`${bookClass} book-embed book-embed--unavailable`}>
        <div>
          <strong>
            {unavailable
              ? 'This book is unavailable'
              : 'The book preview couldn’t load'}
          </strong>
          <div className="book-embed__fallback-actions">
            {!unavailable && (
              <button
                type="button"
                onClick={handleRetry}
                onKeyDown={handleRetryKeyDown}
              >
                Try again
              </button>
            )}
            <Link
              to={path}
              onClick={handleClick}
              onAuxClick={stopClick}
              onKeyDown={handleKeyDown}
            >
              Open book →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={path}
      className={`${bookClass} book-embed${compact ? ' book-embed--compact' : ''}`}
      aria-label={book ? `Read ${book.title}` : 'Open book'}
      aria-busy={loading}
      onClick={handleClick}
      onAuxClick={stopClick}
      onKeyDown={handleKeyDown}
    >
      <span
        className={`book-embed__cover${cover ? ' has-art' : ''}`}
        aria-hidden="true"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedCover(cover)}
          />
        ) : (
          <span className="book-embed__cover-type">
            <span className="book-embed__cover-rule" />
            <span>{book?.title || 'A book on Twinkle'}</span>
            <span className="book-embed__cover-rule" />
          </span>
        )}
      </span>
      <span className="book-embed__copy">
        <span className="book-embed__eyebrow">TWINKLE BOOKS</span>
        <span className="book-embed__title">
          {book?.title || 'Opening the cover…'}
        </span>
        {book?.author.username && (
          <span className="book-embed__author">by @{book.author.username}</span>
        )}
        {book?.description && (
          <span className="book-embed__description">{book.description}</span>
        )}
        <span className="book-embed__read">
          Read book <span aria-hidden="true">↗</span>
        </span>
      </span>
    </Link>
  );

  function handleRetry(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setRetry((value) => value + 1);
  }

  function handleRetryKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  }

  function stopClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
    if (
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.button === 0
    ) {
      saveScrollAnchorForElement(event.currentTarget);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === 'Enter') event.stopPropagation();
    if (event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.click();
    }
  }
}

const bookClass = css`
  && {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(7rem, 25%) minmax(0, 1fr);
    align-items: center;
    gap: 2.2rem;
    width: 100%;
    max-width: 64rem;
    min-width: 0;
    height: auto;
    align-self: center;
    padding: 2rem 2.4rem 2rem 2rem;
    border: 1px solid #e0d7c8;
    border-radius: 12px;
    background: #faf7f0;
    color: #292a26;
    text-align: left;
    text-decoration: none;
    line-height: 1.4;
    white-space: normal;
  }
  &:hover {
    border-color: #9c997f;
  }
  &:focus-visible {
    outline: 3px solid #418ceb;
    outline-offset: 3px;
  }
  .book-embed__cover {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 3 / 4;
    min-width: 0;
    border-radius: 2px 5px 5px 2px;
    background: #314e48;
    color: #fff2cf;
    box-shadow:
      3px 2px 0 #e4dcc9,
      5px 3px 0 #fffdfa,
      6px 4px 0 #d5cbb6,
      6px 8px 12px #40352321;
    transition: transform 160ms ease;
    overflow: hidden;
  }
  .book-embed__cover::after {
    content: '';
    position: absolute;
    inset: 0 auto 0 5px;
    width: 2px;
    background: #ffffff20;
    border-left: 1px solid #00000025;
  }
  .book-embed__cover.has-art {
    background: #e9e3d8;
  }
  .book-embed__cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .book-embed__cover-type {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem;
    font:
      600 1.5rem/1.25 Georgia,
      serif;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .book-embed__cover-type > span:nth-child(2) {
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .book-embed__cover-rule {
    width: 2.5rem;
    height: 1px;
    background: #d5bf80;
  }
  .book-embed__copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
    min-width: 0;
  }
  .book-embed__copy > span {
    max-width: 100%;
    min-width: 0;
    word-break: break-word;
  }
  .book-embed__eyebrow {
    color: #726d60;
    font:
      700 max(1rem, 10px)/1.3 Arial,
      sans-serif;
    letter-spacing: 0.14em;
  }
  .book-embed__title {
    font:
      700 max(2.5rem, 25px)/1.13 Georgia,
      'Times New Roman',
      serif;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .book-embed__author {
    color: #68685e;
    font-size: max(1.2rem, 12px);
    overflow-wrap: anywhere;
  }
  .book-embed__description {
    margin-top: 0.25rem;
    color: #52564e;
    font-size: max(1.3rem, 13px);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .book-embed__read {
    display: inline-flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 0.8rem;
    padding: 0.65rem 1.2rem;
    border-radius: 5px;
    background: #314e48;
    color: #fff;
    font-size: max(1.2rem, 12px);
    font-weight: 700;
  }
  @media (hover: hover) {
    &:hover .book-embed__cover {
      transform: translateY(-2px) rotate(-1deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .book-embed__cover {
      transition: none;
    }
    &:hover .book-embed__cover {
      transform: none;
    }
  }
  &.book-embed--compact {
    gap: 1.4rem;
    padding: 1.2rem;
    max-width: 48rem;
  }
  &.book-embed--compact .book-embed__title {
    font-size: max(1.8rem, 18px);
  }
  &.book-embed--compact .book-embed__description {
    -webkit-line-clamp: 2;
    font-size: max(1.1rem, 12px);
  }
  &.book-embed--compact .book-embed__cover-type {
    font-size: max(1.2rem, 12px);
  }
  &.book-embed--unavailable {
    grid-template-columns: 1fr;
    font-size: max(1.2rem, 12px);
  }
  .book-embed__fallback-actions {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.7rem;
  }
  .book-embed__fallback-actions a,
  .book-embed__fallback-actions button {
    color: #314e48;
    text-decoration: underline;
    font-size: max(1.2rem, 12px);
  }
  @media (max-width: 480px) {
    && {
      gap: 1.4rem;
      padding: 1.3rem;
    }
    .book-embed__title {
      font-size: max(1.9rem, 19px);
    }
    .book-embed__description {
      -webkit-line-clamp: 2;
      font-size: max(1.15rem, 12px);
    }
    .book-embed__cover-type {
      font-size: max(1.2rem, 12px);
      padding: 0.9rem;
    }
  }
`;
