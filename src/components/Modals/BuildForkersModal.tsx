import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import UserListModal from '~/components/Modals/UserListModal';
import { useAppContext } from '~/contexts';

const forkersPageSize = 30;

const triggerClass = css`
  appearance: none;
  margin: 0;
  font-family: inherit;
  text-align: inherit;
  cursor: pointer;
`;

type BuildForkerCursor = {
  forkBuildId?: number;
  forkedAt?: number;
} | null;

interface BuildForkerUser {
  id: number;
  profilePicUrl: string;
  username: string;
}

export function BuildForkersTrigger({
  buildId,
  children,
  className,
  disabled,
  style,
  title = 'People who forked this app'
}: {
  buildId: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
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
      >
        {children}
      </button>
      {modalShown ? (
        <BuildForkersModal
          buildId={normalizedBuildId}
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
}

export default function BuildForkersModal({
  buildId,
  onHide
}: {
  buildId: number;
  onHide: () => void;
}) {
  const loadBuildForkers = useAppContext(
    (v) => v.requestHelpers.loadBuildForkers
  );
  const [cursor, setCursor] = useState<BuildForkerCursor>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const mountedRef = useRef(false);
  const [users, setUsers] = useState<BuildForkerUser[]>([]);

  useEffect(() => {
    let canceled = false;
    mountedRef.current = true;
    setCursor(null);
    setError('');
    setLoading(true);
    setLoadMoreButtonShown(false);
    setUsers([]);
    void loadForkers({ append: false, canceled: () => canceled });
    return () => {
      canceled = true;
      mountedRef.current = false;
    };
    // loadBuildForkers is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId]);

  return (
    <UserListModal
      emptyMessage={error || 'No current forks found.'}
      loadMoreButtonShown={loadMoreButtonShown}
      loading={loading}
      loadingMore={loadingMore}
      onHide={onHide}
      onLoadMore={handleLoadMore}
      title="People who forked this app"
      users={users}
    />
  );

  async function handleLoadMore() {
    if (loading || loadingMore || !cursor) return;
    setLoadingMore(true);
    await loadForkers({
      append: true,
      cursorOverride: cursor,
      canceled: () => !mountedRef.current
    });
    setLoadingMore(false);
  }

  async function loadForkers({
    append,
    canceled,
    cursorOverride = null
  }: {
    append: boolean;
    canceled: () => boolean;
    cursorOverride?: BuildForkerCursor;
  }) {
    try {
      const data = await loadBuildForkers(buildId, {
        cursor: cursorOverride,
        limit: forkersPageSize
      });
      if (canceled()) return;
      const nextUsers = normalizeForkers(data?.users);
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
          'Forkers could not be loaded.'
      );
      setLoadMoreButtonShown(false);
    } finally {
      if (!canceled()) {
        setLoading(false);
      }
    }
  }
}

function normalizeForkers(value: unknown): BuildForkerUser[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((user: any) => ({
      id: Number(user?.id || 0),
      profilePicUrl: String(user?.profilePicUrl || ''),
      username: String(user?.username || '')
    }))
    .filter((user) => user.id > 0 && user.username);
}

function normalizeCursor(value: any): BuildForkerCursor {
  const forkBuildId = Number(value?.forkBuildId || 0);
  const forkedAt = Number(value?.forkedAt || 0);
  if (forkBuildId <= 0 || forkedAt <= 0) return null;
  return { forkBuildId, forkedAt };
}

function mergeUsers(
  currentUsers: BuildForkerUser[],
  nextUsers: BuildForkerUser[]
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
