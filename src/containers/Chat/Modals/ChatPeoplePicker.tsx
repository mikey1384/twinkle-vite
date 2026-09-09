import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import { useAppContext, useKeyContext } from '~/contexts';

export interface ChatInvitePerson {
  id: number;
  username: string;
  realName?: string;
  profilePicUrl?: string;
}

export default function ChatPeoplePicker({ channelId, selected, onChange, disabled, excludedIds = [], autoFocus = false }: {
  channelId?: number;
  selected: ChatInvitePerson[];
  onChange: (people: ChatInvitePerson[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  excludedIds?: Array<number | string>;
}) {
  const search = useAppContext((v) => v.requestHelpers.searchUserToInvite);
  const viewerId = useKeyContext((v) => v.myState.userId);
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; people: ChatInvitePerson[]; failed: boolean } | null>(null);
  const queryKey = JSON.stringify([viewerId, channelId, query.trim(), attempt, Boolean(disabled), composing]);
  const latestKey = useRef(queryKey);
  latestKey.current = queryKey;
  const hasQuery = query.trim().length >= 2;
  const currentResult = result?.key === queryKey ? result : null;
  const searching = !disabled && !composing && hasQuery && !currentResult;
  const excluded = new Set([Number(viewerId), ...excludedIds.map(Number), ...selected.map((person) => person.id)]);
  const people = (currentResult?.people || []).filter((person) => !excluded.has(person.id));

  useEffect(() => {
    if (disabled || composing || !hasQuery) return;
    let canceled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await search({ channelId, searchText: query.trim() });
        if (!Array.isArray(response)) throw new Error('Invalid people response');
        const unique = new Map<number, ChatInvitePerson>();
        for (const person of response) {
          const id = Number(person?.id);
          if (Number.isSafeInteger(id) && id > 0 && typeof person?.username === 'string' && person.username.trim()) {
            unique.set(id, {
              ...person,
              id,
              username: person.username,
              realName: typeof person.realName === 'string' ? person.realName : undefined,
              profilePicUrl: typeof person.profilePicUrl === 'string' ? person.profilePicUrl : undefined
            });
          }
        }
        if (!canceled && latestKey.current === queryKey) setResult({ key: queryKey, people: [...unique.values()], failed: false });
      } catch {
        if (!canceled && latestKey.current === queryKey) setResult({ key: queryKey, people: [], failed: true });
      }
    }, 350);
    return () => { canceled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, composing, disabled, hasQuery, query, queryKey]);

  return <section className={pickerClass} aria-label="Choose people">
    <label htmlFor={inputId}>Find people</label>
    <input ref={input} id={inputId} type="search" value={query} disabled={disabled} autoFocus={autoFocus}
      placeholder="Search by username or name" autoComplete="off" spellCheck={false}
      aria-describedby={`${inputId}-hint`} aria-controls={`${inputId}-results`}
      onChange={(event) => setQuery(event.target.value)}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(event) => { setComposing(false); setQuery(event.currentTarget.value); }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Enter') event.preventDefault();
        if (event.key === 'Escape' && query) { event.preventDefault(); event.stopPropagation(); setQuery(''); }
        if (event.key === 'ArrowDown' && people.length) {
          event.preventDefault();
          document.getElementById(`${inputId}-results`)?.querySelector<HTMLButtonElement>('button')?.focus();
        }
      }} />
    <p id={`${inputId}-hint`} className="field-hint">Type at least 2 characters. Selecting a person doesn’t send an invitation.</p>
    <div id={`${inputId}-results`}>
      {searching && <p role="status" className="search-status">Searching people…</p>}
      {currentResult?.failed && <div className="error" role="alert">Couldn’t search for people. <button type="button" onClick={() => { input.current?.focus(); setAttempt((value) => value + 1); }}>Try again</button></div>}
      {hasQuery && currentResult && !currentResult.failed && !people.length && <p role="status" className="search-status">No other people found. Try another name.</p>}
      {!!people.length && !disabled && <ul aria-label="People search results">{people.map((person) => <li key={person.id}>
        <button type="button" aria-label={`Add ${person.username}`} onClick={() => {
          onChange([...selected, person]);
          setQuery('');
          input.current?.focus();
        }}><UserSearchResultRow {...person} userId={person.id} chat /><Icon icon="plus" /></button>
      </li>)}</ul>}
    </div>
    {!!selected.length && <div className="selected"><p className="field-title">Selected · {selected.length}</p><ul aria-label="Selected people">{selected.map((person) => <li key={person.id}>
      <span>{person.username}</span><button type="button" disabled={disabled} aria-label={`Remove ${person.username}`} onClick={() => {
        onChange(selected.filter((item) => item.id !== person.id));
        input.current?.focus();
      }}><Icon icon="times" /></button>
    </li>)}</ul></div>}
  </section>;
}

const pickerClass = css`
  min-width: 0;
  ul { list-style: none; margin: 8px 0 0; padding: 0; max-height: 240px; overflow-y: auto; }
  li { min-width: 0; }
  button { display: flex; width: 100%; min-height: 48px; align-items: center; gap: 12px; padding: 8px; border: 0; border-radius: 8px; color: #334155; background: #fff; font: inherit; text-align: left; cursor: pointer; }
  button > svg { flex-shrink: 0; }
  button:hover:not(:disabled) { background: #eef2f7; }
  button:disabled { opacity: .5; cursor: default; }
  .search-status { margin: 10px 0 0; padding: 10px; color: #526176; background: #f8fafc; border-radius: 8px; }
  .error { margin-top: 10px; }
  .error button { width: auto; min-height: 44px; padding: 8px 12px; margin-top: 8px; }
  .selected { margin-top: 16px; }
  .selected ul { display: flex; flex-direction: column; gap: 4px; }
  .selected li { display: flex; align-items: center; gap: 8px; padding-left: 10px; background: #f1f5f9; border-radius: 8px; }
  .selected li > span { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .selected button { width: 44px; min-height: 44px; flex-shrink: 0; justify-content: center; background: transparent; }
`;
