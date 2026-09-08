import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import { useKeyContext, useAppContext } from '~/contexts';
import { isSupermod } from '~/helpers';
import useChatDialogRequest from './useChatDialogRequest';
import { chatFormActionStyle, chatFormClass, chatFormModalClass } from './chatFormStyles';

export interface OwnerSelection {
  newOwner: any;
  andLeave: boolean;
  canApply?: () => boolean;
  onTransferred?: () => void;
}

export default function SelectNewOwnerModal({
  andLeave = false,
  isClass,
  loading = false,
  members,
  modalOverModal,
  onHide,
  onSubmit,
  channelId
}: {
  andLeave?: boolean;
  isClass: boolean;
  loading?: boolean;
  members: any[];
  modalOverModal?: boolean;
  onHide: () => void;
  onSubmit: (selection: OwnerSelection) => void | Promise<void>;
  channelId: number;
}) {
  const userId = useKeyContext(v => v.myState.userId);
  const doneColor = useKeyContext(v => v.theme.done.color);
  const searchChannelMembers = useAppContext(v => v.requestHelpers.searchChannelMembers);
  const scope = [userId, channelId, isClass, andLeave].join(':');
  const request = useChatDialogRequest(scope);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [transferred, setTransferred] = useState(false);
  const [result, setResult] = useState<{ key: string; people: any[]; failed: boolean } | null>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const busy = request.busy || loading;
  const locked = busy || transferred;
  const text = query.trim();
  const searchKey = JSON.stringify([scope, text, attempt, composing, locked]);
  const latestKey = useRef(searchKey);
  latestKey.current = searchKey;
  const remote = result?.key === searchKey ? result : null;
  const hasSearch = text.length >= 3;
  const searching = hasSearch && !locked && !composing && !remote;
  const eligibleMembers = eligiblePeople(members);
  const shownMembers = remote && !remote.failed
    ? eligiblePeople(remote.people)
    : eligibleMembers.filter(person => person.username.toLowerCase().includes(text.toLowerCase()));

  useEffect(() => {
    setQuery('');
    setSelected(null);
    setTransferred(false);
    setResult(null);
    setComposing(false);
  }, [scope]);

  useEffect(() => {
    if (!hasSearch || composing || locked) return;
    let canceled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await searchChannelMembers({ channelId, searchText: text });
        if (!Array.isArray(response)) throw new Error('Invalid member search response');
        if (!canceled && latestKey.current === searchKey) setResult({ key: searchKey, people: response, failed: false });
      } catch {
        if (!canceled && latestKey.current === searchKey) setResult({ key: searchKey, people: [], failed: true });
      }
    }, 350);
    return () => { canceled = true; clearTimeout(timer); };
  }, [channelId, composing, hasSearch, locked, searchChannelMembers, searchKey, text]);

  const error = transferred
    ? andLeave
      ? 'Ownership has changed, but you could not leave the group. Retry leaving; the ownership transfer will not be repeated.'
      : 'Ownership has changed, but the channel could not finish updating. Retry to finish without repeating the transfer.'
    : request.error;

  return <Modal modalKey="SelectNewOwnerModal" isOpen aria-label="Choose a new channel owner"
    className={chatFormModalClass} hasHeader={false} bodyPadding={0}
    modalLevel={modalOverModal ? 2 : undefined} showCloseButton={!busy}
    closeOnEscape={!busy} closeOnBackdropClick={!busy}
    onClose={() => { if (!request.pending.current && !loading) onHide(); }}>
    <section className={chatFormClass}>
      <header>
        <h2>{andLeave ? 'Choose an owner before leaving' : 'Change channel owner'}</h2>
        <p className="description">{isClass
          ? 'Only another teacher in this classroom can become its owner.'
          : 'Choose a member to take over this group.'} Ownership changes only when you confirm.</p>
      </header>
      <main>
        <div>
          <label htmlFor={inputId}>Find a member</label>
          <input ref={inputRef} id={inputId} type="search" autoFocus autoComplete="off"
            spellCheck={false} placeholder="Search channel members" value={query} disabled={locked}
            aria-describedby={inputId + '-hint'} aria-controls={inputId + '-results'}
            onChange={event => setQuery(event.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={event => { setComposing(false); setQuery(event.currentTarget.value); }}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing || event.keyCode === 229) return;
              if (event.key === 'Enter') event.preventDefault();
              if (event.key === 'Escape' && query) { event.preventDefault(); event.stopPropagation(); setQuery(''); }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                resultsRef.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
              }
            }} />
          <p id={inputId + '-hint'} className="field-hint">Filter the members below, or type at least 3 characters to search the whole group.</p>
        </div>
        {searching && <p role="status" className="field-hint">Searching channel members…</p>}
        {remote?.failed && <div className="error" role="alert">
          Couldn’t search the whole group. Any matching loaded members are still shown.
          <Button variant="ghost" style={chatFormActionStyle} uppercase={false} onClick={() => {
            inputRef.current?.focus();
            setAttempt(value => value + 1);
          }}>Try member search again</Button>
        </div>}
        <ul ref={resultsRef} id={inputId + '-results'} className={membersClass} aria-label="Eligible new owners">
          {shownMembers.map(person => <li key={person.id}>
            <label>
              <input type="radio" name={inputId + '-owner'} value={person.id}
                aria-label={'Select ' + person.username} checked={selected?.id === person.id} disabled={locked}
                onChange={() => setSelected(person)} />
              <UserSearchResultRow {...person} userId={person.id} chat />
            </label>
          </li>)}
        </ul>
        {!shownMembers.length && !searching && <p role="status" className="field-hint">{text
          ? 'No eligible members match this search.'
          : isClass ? 'No other teachers are loaded. Search for another teacher in this classroom, or invite one first.'
          : 'No other members are loaded. Search the group, or invite someone before changing ownership.'}</p>}
        {selected && <p className={selectionClass}>
          <span className="field-title">{transferred ? 'New owner' : 'Selected new owner'}</span>
          <strong>{selected.username}</strong>
          {andLeave && !transferred && <span>You will leave this group after the transfer succeeds.</span>}
        </p>}
        {request.error && <p ref={request.errorRef} id={request.errorId} className="error" role="alert">{error}</p>}
      </main>
      <footer>
        <Button style={chatFormActionStyle} variant="ghost" uppercase={false} disabled={busy}
          onClick={onHide}>{transferred ? andLeave ? 'Stay in group' : 'Close' : 'Cancel'}</Button>
        <Button style={chatFormActionStyle} variant="soft" tone="raised" uppercase={false} color={doneColor}
          disabled={!selected} aria-busy={busy} aria-describedby={request.error ? request.errorId : undefined}
          aria-label={busy ? 'Changing channel ownership' : transferred ? andLeave ? 'Retry leaving group' : 'Finish ownership update' : andLeave ? 'Transfer ownership and leave' : 'Confirm new owner'}
          onClick={handleSubmit}>{busy ? 'Working…' : transferred ? andLeave ? 'Retry leaving' : 'Finish update' : andLeave ? 'Transfer & leave' : 'Change owner'}</Button>
      </footer>
    </section>
  </Modal>;

  function eligiblePeople(value: any[]) {
    const unique = new Map<number, any>();
    for (const person of Array.isArray(value) ? value : []) {
      const id = Number(person?.id);
      if (Number.isSafeInteger(id) && id > 0 && id !== Number(userId) &&
        typeof person?.username === 'string' && person.username.trim() &&
        (!isClass || isSupermod(Number(person.level)))) unique.set(id, {
          ...person,
          id,
          realName: typeof person.realName === 'string' ? person.realName : undefined,
          profilePicUrl: typeof person.profilePicUrl === 'string' ? person.profilePicUrl : undefined
        });
    }
    return [...unique.values()];
  }

  async function handleSubmit() {
    if (!selected || busy || !eligiblePeople([selected]).length) return;
    await request.run('Couldn’t change the owner. Your selection is kept. Please try again.', async isCurrent => {
      await onSubmit({
        newOwner: selected,
        andLeave,
        canApply: isCurrent,
        onTransferred: () => { if (isCurrent()) setTransferred(true); }
      });
      if (isCurrent()) onHide();
    });
  }
}

const membersClass = css`
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #dce3ed;
  border-radius: 12px;
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
  }
  label:hover { background: #f1f5f9; }
  label:has(input:checked) { background: #eef2f7; }
  input { width: 18px; height: 18px; flex-shrink: 0; accent-color: #334155; }
`;

const selectionClass = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 12px;
  border: 1px solid #dce3ed;
  border-radius: 10px;
  background: #f8fafc;
  overflow-wrap: anywhere;
`;
