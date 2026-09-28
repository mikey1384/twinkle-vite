import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import type { UserSearchResult } from '~/components/UserSearchInput';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useSearch } from '~/helpers/hooks';

type CandidateStatus = 'ok' | 'member' | 'invited' | 'in_crew' | 'hidden';
type Candidate = UserSearchResult & { crewStatus: CandidateStatus };

const STATUS_LABELS: Partial<Record<CandidateStatus, string>> = {
  member: 'in your crew',
  invited: 'invited',
  in_crew: 'in a crew'
};

// The founder's "Invite someone": the site's own user search (SearchInput +
// useSearch debounce + keyboard ↑/↓/Enter, the rows other user pickers use),
// labelled with each person's crew status by the API. Pick someone, then
// press Invite.
export default function InviteUserPicker({
  crewId,
  disabled,
  busy,
  onInvite
}: {
  crewId: number;
  disabled?: boolean;
  busy?: boolean;
  onInvite: (user: { id: number; username: string }) => Promise<boolean> | void;
}) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const loadInviteCandidateStatuses = useAppContext(
    (v) => v.requestHelpers.loadInviteCandidateStatuses
  );
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [hint, setHint] = useState('');
  const sequenceRef = useRef(0);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => {
      sequenceRef.current += 1;
      setResults([]);
    },
    onSetSearchText: setSearchText
  });

  return (
    <div className={css`display: flex; flex-direction: column; gap: 0.6rem;`}>
      {picked ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            padding: 0.6rem 0.8rem;
            border-radius: 1rem;
            border: 1.5px solid ${Color.logoBlue(0.5)};
            background: ${Color.logoBlue(0.06)};
          `}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <UserSearchResultRow
              userId={picked.id}
              username={picked.username}
              realName={picked.realName}
              profilePicUrl={picked.profilePicUrl}
            />
          </span>
          <Button size="sm" color="logoBlue" loading={busy} disabled={disabled || busy} onClick={handleInvite}>
            Invite
          </Button>
          <Button size="sm" variant="ghost" color="darkGray" disabled={busy} onClick={() => setPicked(null)}>
            <Icon icon="times" />
          </Button>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%' }}>
          <SearchInput
            placeholder="Type a username or name"
            value={searchText}
            onChange={disabled ? () => {} : handleSearch}
            onClickOutSide={() => {
              setSearchText('');
              setResults([]);
            }}
            onSelect={handleSelect}
            searchResults={results}
            renderItemLabel={(user: Candidate) => (
              <span
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.6rem;
                  width: 100%;
                  opacity: ${user.crewStatus === 'ok' ? 1 : 0.55};
                `}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <UserSearchResultRow
                    userId={user.id}
                    username={user.username}
                    realName={user.realName}
                    profilePicUrl={user.profilePicUrl}
                  />
                </span>
                {STATUS_LABELS[user.crewStatus] && (
                  <span
                    className={css`
                      padding: 0 0.7rem;
                      border-radius: 999px;
                      background: ${Color.extraLightGray()};
                      font-size: 1.1rem;
                      color: ${Color.darkGray()};
                      white-space: nowrap;
                    `}
                  >
                    {STATUS_LABELS[user.crewStatus]}
                  </span>
                )}
              </span>
            )}
          />
          {searching ? <Loading style={{ position: 'absolute', top: 0, right: 0 }} /> : null}
        </div>
      )}
      {hint && <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>{hint}</span>}
    </div>
  );

  async function handleUserSearch(text: string) {
    const sequence = ++sequenceRef.current;
    const users: UserSearchResult[] = await searchUsers(text);
    if (sequence !== sequenceRef.current) return;
    const list = Array.isArray(users) ? users : [];
    let statuses: Record<number, CandidateStatus> = {};
    if (list.length) {
      try {
        ({ statuses } = await loadInviteCandidateStatuses({
          crewId,
          userIds: list.map((user) => user.id)
        }));
      } catch {
        statuses = {};
      }
    }
    if (sequence !== sequenceRef.current) return;
    setResults(
      list
        .map((user) => ({ ...user, crewStatus: statuses[user.id] || 'ok' }))
        .filter((user) => user.crewStatus !== 'hidden')
    );
  }

  function handleSelect(user: Candidate) {
    setHint('');
    if (user.crewStatus !== 'ok') {
      setHint(
        user.crewStatus === 'invited'
          ? `${user.username} already has an invite from your crew.`
          : user.crewStatus === 'member'
          ? `${user.username} is already in your crew.`
          : `${user.username} is already in another crew.`
      );
      return;
    }
    setPicked(user);
    setSearchText('');
    setResults([]);
  }

  async function handleInvite() {
    if (!picked) return;
    const ok = await onInvite({ id: picked.id, username: picked.username });
    if (ok !== false) setPicked(null);
  }
}
