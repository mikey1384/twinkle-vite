import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useSearch } from '~/helpers/hooks';

export interface MeetupTeacher {
  userId: number;
  username: string;
  profilePicUrl: string;
}

// The grown-up step's "A Twinkle teacher": only approved Twinkle teachers can
// be picked (the server's list, GET /meetup-quest/teachers, and it checks the
// pick again on save). The same search box and rows as InviteUserPicker.
export default function TeacherPicker({
  picked,
  disabled,
  onPick
}: {
  picked: MeetupTeacher | null;
  disabled?: boolean;
  onPick: (teacher: MeetupTeacher | null) => void;
}) {
  const searchMeetupTeachers = useAppContext(
    (v) => v.requestHelpers.searchMeetupTeachers
  );
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<MeetupTeacher[]>([]);
  const [noMatch, setNoMatch] = useState('');
  // the search itself failed (network, server): never shown as "no match"
  const [searchFailed, setSearchFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const lastQueryRef = useRef('');
  const sequenceRef = useRef(0);
  const { handleSearch, searching } = useSearch({
    onSearch: handleTeacherSearch,
    onClear: () => {
      sequenceRef.current += 1;
      setResults([]);
      setNoMatch('');
      setSearchFailed(false);
    },
    onSetSearchText: setSearchText
  });

  if (picked) {
    return (
      <div
        data-teacher-picked
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.6rem 0.8rem;
          border-radius: 1rem;
          border: 1.5px solid ${Color.logoBlue(0.5)};
          background: ${Color.logoBlue(0.06)};
          flex: 1 1 20rem;
          min-width: 0;
        `}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <UserSearchResultRow
            userId={picked.userId}
            username={picked.username}
            profilePicUrl={picked.profilePicUrl}
          />
        </span>
        <span
          className={css`
            padding: 0 0.7rem;
            border-radius: 999px;
            background: ${Color.green(0.12)};
            color: ${Color.green()};
            font-size: 1.1rem;
            font-weight: 600;
            white-space: nowrap;
          `}
        >
          Twinkle teacher
        </span>
        <Button
          size="sm"
          variant="ghost"
          color="darkGray"
          aria-label="Pick a different teacher"
          disabled={disabled}
          onClick={() => onPick(null)}
        >
          <Icon icon="times" />
        </Button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flex: '1 1 20rem', minWidth: 0 }}>
      <SearchInput
        placeholder="Search teachers by username"
        value={searchText}
        onChange={disabled ? () => {} : handleSearch}
        onClickOutSide={() => {
          setSearchText('');
          setResults([]);
          setNoMatch('');
          setSearchFailed(false);
        }}
        onSelect={handleSelect}
        searchResults={results}
        renderItemLabel={(teacher: MeetupTeacher) => (
          <UserSearchResultRow
            userId={teacher.userId}
            username={teacher.username}
            profilePicUrl={teacher.profilePicUrl}
          />
        )}
      />
      {searching ? (
        <Loading style={{ position: 'absolute', top: 0, right: 0 }} />
      ) : null}
      {searchFailed && !searching ? (
        <div
          data-teacher-search-error
          className={css`
            margin-top: 0.4rem;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.6rem;
            font-size: 1.2rem;
            color: ${Color.rose()};
          `}
        >
          <span>Could not search teachers. Try again.</span>
          <Button
            size="sm"
            variant="soft"
            color="logoBlue"
            loading={retrying}
            disabled={disabled || retrying}
            onClick={handleRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {noMatch && !searching && !searchFailed ? (
        <div
          className={css`
            margin-top: 0.4rem;
            font-size: 1.2rem;
            color: ${Color.darkGray()};
          `}
        >
          {noMatch}
        </div>
      ) : null}
    </div>
  );

  async function handleTeacherSearch(text: string) {
    const sequence = ++sequenceRef.current;
    lastQueryRef.current = text;
    let teachers: MeetupTeacher[] = [];
    try {
      ({ teachers } = await searchMeetupTeachers(text));
    } catch {
      if (sequence !== sequenceRef.current) return;
      setResults([]);
      setNoMatch('');
      setSearchFailed(true);
      return;
    }
    if (sequence !== sequenceRef.current) return;
    setSearchFailed(false);
    const list = Array.isArray(teachers) ? teachers : [];
    setResults(list);
    setNoMatch(
      list.length
        ? ''
        : `No Twinkle teacher's username matches "${text.trim()}". Ask your teacher for their Twinkle username.`
    );
  }

  async function handleRetry() {
    if (!lastQueryRef.current.trim()) return;
    setRetrying(true);
    try {
      await handleTeacherSearch(lastQueryRef.current);
    } finally {
      setRetrying(false);
    }
  }

  function handleSelect(teacher: MeetupTeacher) {
    onPick({
      userId: teacher.userId,
      username: teacher.username,
      profilePicUrl: teacher.profilePicUrl
    });
    setSearchText('');
    setResults([]);
    setNoMatch('');
    setSearchFailed(false);
  }
}
