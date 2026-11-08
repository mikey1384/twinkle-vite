import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { Color, mobileMaxWidth } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import {
  isEmptyDraftText,
  type PostDraftEntry,
  type PostDraftText
} from './usePostDrafts';

// The drafts row above the post form: one chip per draft, the one being
// written highlighted, plus "New post" to set it aside and start another.
// Hidden until there is something to set aside, so a first post being
// typed doesn't move the form. Locked while a post is on its way.
export default function DraftTabs({
  entries,
  activeKey,
  activeText,
  activeIsFresh,
  busy,
  locked,
  error,
  onSelect,
  onNew,
  onDelete
}: {
  entries: PostDraftEntry[];
  activeKey: string;
  activeText: PostDraftText;
  activeIsFresh: boolean;
  busy: string | null;
  locked: boolean;
  error: string;
  onSelect: (key: string) => void;
  onNew: () => void;
  onDelete: (key: string) => Promise<void>;
}) {
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const chips = entries
    .map((entry) =>
      entry.key === activeKey ? { ...entry, ...activeText } : entry
    )
    .filter((entry) => entry.key === activeKey || !isEmptyDraftText(entry));
  const activeIsEmpty = isEmptyDraftText(activeText);
  const hasDraftToShow =
    chips.some(
      (entry) => entry.key !== activeKey && !isEmptyDraftText(entry)
    ) ||
    (!activeIsFresh && !activeIsEmpty);
  const errorLine = error ? (
    <p
      role="alert"
      className={css`
        margin: -0.6rem 0 1.2rem;
        font-size: 1.3rem;
        color: ${Color.rose()};
      `}
    >
      {error}
    </p>
  ) : null;
  if (!hasDraftToShow) return errorLine;
  const confirming = chips.find((entry) => entry.key === confirmingKey);
  const allDisabled = !!busy || locked;

  return (
    <>
      <div
        role="tablist"
        aria-label="Your drafts"
        className={css`
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.4rem;
          /* clear of the "Draft saved" note in the top corner */
          padding-right: 8rem;
          @media (max-width: ${mobileMaxWidth}) {
            /* below the "Draft saved" note, "New post" first */
            padding-right: 0;
            margin-top: 2.2rem;
            > .new-post {
              order: -1;
            }
          }
        `}
      >
        {chips.map((entry) => {
          const isActive = entry.key === activeKey;
          const isEmpty = isEmptyDraftText(entry);
          const isBusy = busy === entry.key;
          const label = isEmpty ? 'New post' : draftLabel(entry);
          return (
            <div
              key={entry.key}
              className={css`
                display: flex;
                align-items: center;
                max-width: 100%;
                border-radius: 999px;
                border: 1px solid
                  ${isActive ? Color.logoBlue(0.7) : 'var(--ui-border)'};
                background: ${isActive ? Color.logoBlue(0.1) : '#fff'};
                color: ${isActive ? Color.logoBlue() : Color.darkerGray()};
                font-size: 1.3rem;
                transition:
                  background 0.15s,
                  border-color 0.15s;
                &:hover {
                  border-color: ${Color.logoBlue(0.5)};
                }
              `}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={(!!busy && !isBusy) || locked}
                onClick={() => onSelect(entry.key)}
                title={isEmpty ? label : draftFullLabel(entry)}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  min-width: 0;
                  max-width: 22rem;
                  padding: 0.5rem ${isEmpty ? '1.1rem' : '0.4rem'} 0.5rem 1.1rem;
                  border: none;
                  background: none;
                  color: inherit;
                  font: inherit;
                  font-weight: ${isActive ? 'bold' : 'normal'};
                  cursor: ${isActive ? 'default' : 'pointer'};
                  @media (max-width: ${mobileMaxWidth}) {
                    max-width: 12.5rem;
                  }
                `}
              >
                {isBusy ? (
                  <Icon icon="spinner" pulse style={{ flexShrink: 0 }} />
                ) : (
                  <Icon
                    icon={isEmpty ? 'pencil-alt' : 'file-text'}
                    style={{ flexShrink: 0, opacity: 0.7 }}
                  />
                )}
                <span
                  className={css`
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                  `}
                >
                  {label}
                </span>
              </button>
              {!isEmpty && (
                <button
                  type="button"
                  aria-label={`Delete draft "${draftLabel(entry)}"`}
                  title="Delete draft"
                  disabled={allDisabled}
                  onClick={() => setConfirmingKey(entry.key)}
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.6rem;
                    height: 2.6rem;
                    margin-right: 0.3rem;
                    border: none;
                    border-radius: 50%;
                    background: none;
                    color: ${Color.gray()};
                    font-size: 1.1rem;
                    cursor: pointer;
                    &:hover:not(:disabled) {
                      color: ${Color.rose()};
                      background: ${Color.rose(0.1)};
                    }
                    @media (max-width: ${mobileMaxWidth}) {
                      width: 3.4rem;
                      height: 3.4rem;
                      margin-right: 0;
                    }
                  `}
                >
                  <Icon icon="times" />
                </button>
              )}
            </div>
          );
        })}
        {!activeIsEmpty && (
          <button
            type="button"
            disabled={allDisabled}
            onClick={onNew}
            className={`new-post ${css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem 1.1rem;
              border-radius: 999px;
              border: 1px dashed ${Color.logoBlue(0.6)};
              background: none;
              color: ${Color.logoBlue()};
              font-size: 1.3rem;
              font-weight: bold;
              cursor: pointer;
              &:hover:not(:disabled) {
                background: ${Color.logoBlue(0.08)};
              }
              &:disabled {
                opacity: 0.6;
                cursor: default;
              }
            `}`}
          >
            <Icon
              icon={busy === 'new' ? 'spinner' : 'plus'}
              pulse={busy === 'new'}
            />
            <span>New post</span>
          </button>
        )}
        {confirming && (
          <ConfirmModal
            modalOverModal
            title="Delete this draft?"
            descriptionFontSize="1.7rem"
            description={
              <span style={{ textAlign: 'center' }}>
                &ldquo;{draftLabel(confirming)}&rdquo; will be deleted. This
                can&apos;t be undone.
              </span>
            }
            confirmButtonLabel="Delete"
            confirmButtonColor="rose"
            onHide={() => setConfirmingKey(null)}
            onConfirm={async () => {
              try {
                await onDelete(confirming.key);
              } finally {
                // a failed delete shows its message under the row
                setConfirmingKey(null);
              }
            }}
          />
        )}
      </div>
      {errorLine}
    </>
  );
}

function draftFullLabel(text: PostDraftText) {
  if (!stringIsEmpty(text.title)) return text.title.trim();
  const firstLine = (text.description || '')
    .split('\n')
    .find((line) => !stringIsEmpty(line));
  return (firstLine || '').trim() || 'Untitled draft';
}

function draftLabel(text: PostDraftText) {
  const label = draftFullLabel(text);
  return label.length > 40 ? `${label.slice(0, 40)}…` : label;
}
