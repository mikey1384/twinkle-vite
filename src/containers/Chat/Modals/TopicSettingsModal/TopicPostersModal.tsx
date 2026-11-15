import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import { useAppContext, useKeyContext } from '~/contexts';
import type { TopicPoster } from '../../topicPosting';
import { chatFormClass, chatFormModalClass } from '../chatFormStyles';

// Picks who can post in a topic from this chat's own members: the loaded
// members are listed with their faces, and typing 3+ letters searches the
// whole group (the same member search as "Change channel owner").
export default function TopicPostersModal({
  channelId,
  members,
  selected: initialSelected,
  alwaysAllowedIds,
  onDone,
  onHide
}: {
  channelId: number;
  members: TopicPoster[];
  selected: TopicPoster[];
  alwaysAllowedIds: number[];
  onDone: (posters: TopicPoster[]) => void;
  onHide: () => void;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const searchChannelMembers = useAppContext(
    (v) => v.requestHelpers.searchChannelMembers
  );
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<TopicPoster[]>(initialSelected);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    people: TopicPoster[];
    failed: boolean;
  } | null>(null);
  const text = query.trim();
  const searchKey = JSON.stringify([channelId, text, attempt, composing]);
  const latestKey = useRef(searchKey);
  latestKey.current = searchKey;
  const remote = result?.key === searchKey ? result : null;
  const hasSearch = text.length >= 3;
  const searching = hasSearch && !composing && !remote;
  const selectedIds = new Set(selected.map((person) => person.id));
  const loaded = eligible([...initialSelected, ...members]);
  const shown =
    remote && !remote.failed
      ? eligible(remote.people)
      : text
        ? loaded.filter((person) =>
            person.username.toLowerCase().includes(text.toLowerCase())
          )
        : // the chosen first, so a big group still shows who is on the list
          [
            ...eligible(selected),
            ...loaded.filter((person) => !selectedIds.has(person.id))
          ];

  useEffect(() => {
    if (!hasSearch || composing) return;
    let canceled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await searchChannelMembers({
          channelId,
          searchText: text
        });
        if (!Array.isArray(response)) throw new Error('Invalid member search');
        if (!canceled && latestKey.current === searchKey) {
          setResult({ key: searchKey, people: response, failed: false });
        }
      } catch {
        if (!canceled && latestKey.current === searchKey) {
          setResult({ key: searchKey, people: [], failed: true });
        }
      }
    }, 350);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, composing, hasSearch, searchKey, text]);

  return (
    <Modal
      modalKey="TopicPostersModal"
      isOpen
      modalLevel={3}
      priority
      size="md"
      title="Chosen members"
      aria-label="Choose who can post in this topic"
      className={chatFormModalClass}
      style={{ width: 'min(520px, calc(100vw - 24px))', maxWidth: '100%' }}
      bodyPadding={0}
      onClose={onHide}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button color={doneColor} onClick={() => onDone(selected)}>
            Done
          </Button>
        </>
      }
    >
      <section className={chatFormClass}>
        <main>
          <div>
            <label htmlFor={inputId}>Find a member</label>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search this chat's members"
              value={query}
              aria-describedby={`${inputId}-hint`}
              aria-controls={`${inputId}-results`}
              onChange={(event) => setQuery(event.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={(event) => {
                setComposing(false);
                setQuery(event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                if (event.key === 'Enter') event.preventDefault();
                if (event.key === 'Escape' && query) {
                  event.preventDefault();
                  event.stopPropagation();
                  setQuery('');
                }
              }}
            />
            <p id={`${inputId}-hint`} className="field-hint">
              {selected.length
                ? `${selected.length} chosen. The topic's owner and the chat owner can always post.`
                : "Tick who can post. The topic's owner and the chat owner can always post."}
            </p>
          </div>
          {searching && (
            <p role="status" className="field-hint">
              Searching members…
            </p>
          )}
          {remote?.failed && (
            <div className="error" role="alert">
              Couldn’t search the whole chat. Matching loaded members are still shown.{' '}
              <Button
                variant="ghost"
                uppercase={false}
                onClick={() => {
                  inputRef.current?.focus();
                  setAttempt((value) => value + 1);
                }}
              >
                Try again
              </Button>
            </div>
          )}
          <ul
            id={`${inputId}-results`}
            className={membersClass}
            aria-label="Members of this chat"
          >
            {shown.map((person) => (
              <li key={person.id}>
                <label>
                  <UserSearchResultRow
                    {...person}
                    userId={person.id}
                    chat
                  />
                  <input
                    type="checkbox"
                    aria-label={`${person.username} can post`}
                    checked={selectedIds.has(person.id)}
                    onChange={() => handleToggle(person)}
                  />
                </label>
              </li>
            ))}
          </ul>
          {!shown.length && !searching && (
            <p role="status" className="field-hint">
              {text
                ? 'No members match this search.'
                : 'No other members are loaded. Search the chat to find someone.'}
            </p>
          )}
        </main>
      </section>
    </Modal>
  );

  function eligible(value: any[]) {
    const always = new Set(alwaysAllowedIds.map(Number));
    const unique = new Map<number, TopicPoster>();
    for (const person of Array.isArray(value) ? value : []) {
      const id = Number(person?.id);
      if (
        Number.isSafeInteger(id) &&
        id > 0 &&
        !always.has(id) &&
        typeof person?.username === 'string' &&
        person.username.trim() &&
        !unique.has(id)
      ) {
        unique.set(id, {
          id,
          username: person.username,
          realName: typeof person.realName === 'string' ? person.realName : undefined,
          profilePicUrl:
            typeof person.profilePicUrl === 'string' ? person.profilePicUrl : undefined
        });
      }
    }
    return [...unique.values()];
  }

  function handleToggle(person: TopicPoster) {
    setSelected((prev) =>
      prev.some((item) => item.id === person.id)
        ? prev.filter((item) => item.id !== person.id)
        : [...prev, person]
    );
  }
}

const membersClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: min(360px, 50vh);
  overflow-y: auto;
  &:empty { display: none; }
  li + li { border-top: 1px solid #eef2f7; }
  label {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 8px;
    margin: 0;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 400;
  }
  label:hover { background: #f1f5f9; }
  label:has(input:checked) { background: #eef2f7; }
  input { width: 20px; height: 20px; margin: 0 4px 0 auto; flex-shrink: 0; accent-color: #334155; }
`;
