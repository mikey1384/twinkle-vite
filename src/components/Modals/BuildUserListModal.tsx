import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import UserListModal from '~/components/Modals/UserListModal';
import { useAppContext } from '~/contexts';

const buildUserListPageSize = 30;

const triggerClass = css`
  appearance: none;
  margin: 0;
  font-family: inherit;
  text-align: inherit;
  cursor: pointer;
`;

type BuildUserListCursor = Record<string, number> | null;

interface BuildUserListUser {
  id: number;
  profilePicUrl: string;
  username: string;
}

export function BuildUserListTrigger({
  buildId,
  children,
  className,
  disabled,
  emptyMessage,
  requestHelperName,
  style,
  title
}: {
  buildId: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  emptyMessage: string;
  requestHelperName: string;
  style?: React.CSSProperties;
  title: string;
}) {
  const [modalShown, setModalShown] = useState(false);
  const normalizedBuildId = Number(buildId || 0);

  if (normalizedBuildId <= 0 || disabled) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cx(className, triggerClass)}
        style={style}
        title={title}
        aria-label={title}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </button>
      {modalShown ? (
        <BuildUserListModal
          buildId={normalizedBuildId}
          emptyMessage={emptyMessage}
          requestHelperName={requestHelperName}
          title={title}
          onHide={() => setModalShown(false)}
        />
      ) : null}
    </>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setModalShown(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }
}

export default function BuildUserListModal({
  buildId,
  emptyMessage,
  requestHelperName,
  title,
  onHide
}: {
  buildId: number;
  emptyMessage: string;
  requestHelperName: string;
  title: string;
  onHide: () => void;
}) {
  const loadBuildUsers = useAppContext(
    (v) => v.requestHelpers[requestHelperName]
  );
  const [cursor, setCursor] = useState<BuildUserListCursor>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const mountedRef = useRef(false);
  const [users, setUsers] = useState<BuildUserListUser[]>([]);

  useEffect(() => {
    let canceled = false;
    mountedRef.current = true;
    setCursor(null);
    setError('');
    setLoading(true);
    setLoadMoreButtonShown(false);
    setUsers([]);
    void loadUsers({ append: false, canceled: () => canceled });
    return () => {
      canceled = true;
      mountedRef.current = false;
    };
    // loadBuildUsers is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, requestHelperName]);

  return (
    <UserListModal
      emptyMessage={error || emptyMessage}
      loadMoreButtonShown={loadMoreButtonShown}
      loading={loading}
      loadingMore={loadingMore}
      onHide={onHide}
      onLoadMore={handleLoadMore}
      title={title}
      users={users}
    />
  );

  async function handleLoadMore() {
    if (loading || loadingMore || !cursor) return;
    setLoadingMore(true);
    await loadUsers({
      append: true,
      cursorOverride: cursor,
      canceled: () => !mountedRef.current
    });
    setLoadingMore(false);
  }

  async function loadUsers({
    append,
    canceled,
    cursorOverride = null
  }: {
    append: boolean;
    canceled: () => boolean;
    cursorOverride?: BuildUserListCursor;
  }) {
    try {
      const data = await loadBuildUsers(buildId, {
        cursor: cursorOverride,
        limit: buildUserListPageSize
      });
      if (canceled()) return;
      const nextUsers = normalizeUsers(data?.users);
      setUsers((currentUsers) =>
        append ? mergeUsers(currentUsers, nextUsers) : nextUsers
      );
      setCursor(normalizeCursor(data?.cursor));
      setLoadMoreButtonShown(Boolean(data?.loadMoreButton));
      setError('');
    } catch (err: any) {
      if (canceled()) return;
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'People could not be loaded.'
      );
      setLoadMoreButtonShown(false);
    } finally {
      if (!canceled()) {
        setLoading(false);
      }
    }
  }
}

function normalizeUsers(value: unknown): BuildUserListUser[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((user: any) => ({
      id: Number(user?.id || 0),
      profilePicUrl: String(user?.profilePicUrl || ''),
      username: String(user?.username || '')
    }))
    .filter((user) => user.id > 0 && user.username);
}

function normalizeCursor(value: any): BuildUserListCursor {
  if (!value || typeof value !== 'object') return null;
  const cursor: Record<string, number> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    const numberValue = Number(rawValue || 0);
    if (numberValue > 0) {
      cursor[key] = numberValue;
    }
  }
  return Object.keys(cursor).length > 0 ? cursor : null;
}

function mergeUsers(
  currentUsers: BuildUserListUser[],
  nextUsers: BuildUserListUser[]
) {
  const seenUserIds = new Set(currentUsers.map((user) => user.id));
  return currentUsers.concat(
    nextUsers.filter((user) => {
      if (seenUserIds.has(user.id)) return false;
      seenUserIds.add(user.id);
      return true;
    })
  );
}
