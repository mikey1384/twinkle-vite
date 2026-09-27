// The signed-in member's block list, shared by chat, profiles, settings and
// socket handlers. It only ever holds the server's canonical list (GET, POST
// and DELETE /chat/blocks each answer with it); nothing here guesses a block
// before the server confirms it. No React or Vite imports, so node tests can
// exercise it; the React hook lives in hooks/useBlockedUsers.ts.

export interface BlockedUser {
  id: number;
  username: string;
  profilePicUrl: string | null;
  blockedAt: number;
}

export interface BlockListState {
  ownerId: number;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  blockedUsers: BlockedUser[];
  blockedIds: ReadonlySet<number>;
  nonBlockableIds: ReadonlySet<number>;
}

let fallbackNonBlockableIds: ReadonlySet<number> = new Set();

// Zero, Ciel and the owner, until the server's own list arrives.
export function setFallbackNonBlockableIds(ids: number[]) {
  fallbackNonBlockableIds = new Set(
    ids.filter((id) => Number.isSafeInteger(id) && id > 0)
  );
}

export function emptyBlockListState(ownerId: number): BlockListState {
  return {
    ownerId,
    status: 'idle',
    blockedUsers: [],
    blockedIds: new Set(),
    nonBlockableIds: fallbackNonBlockableIds
  };
}

export const EMPTY_BLOCK_LIST_STATE = emptyBlockListState(0);
let state: BlockListState = EMPTY_BLOCK_LIST_STATE;
const listeners = new Set<() => void>();

export function setBlockListState(next: BlockListState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeBlockList(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBlockListSnapshot() {
  return state;
}

export function applyBlockListResponse(ownerId: number, data: any) {
  if (!ownerId || !data || !Array.isArray(data.blockedUsers)) return;
  const blockedUsers: BlockedUser[] = data.blockedUsers.map((user: any) => ({
    id: Number(user.id),
    username: String(user.username || ''),
    profilePicUrl: user.profilePicUrl || null,
    blockedAt: Number(user.blockedAt || 0)
  }));
  const serverNonBlockable = Array.isArray(data.nonBlockableUserIds)
    ? data.nonBlockableUserIds.map(Number).filter((id: number) => id > 0)
    : null;
  setBlockListState({
    ownerId,
    status: 'loaded',
    blockedUsers,
    blockedIds: new Set(blockedUsers.map((user) => user.id)),
    nonBlockableIds: serverNonBlockable
      ? new Set(serverNonBlockable)
      : fallbackNonBlockableIds
  });
}

// For non-React callers (socket handlers): whether the signed-in member has
// blocked userId, per the last canonical list.
export function isBlockedByMe(myId: number, userId: number) {
  return (
    !!myId &&
    state.ownerId === Number(myId) &&
    state.blockedIds.has(Number(userId))
  );
}

export function canBlockUser(
  blockList: BlockListState,
  userId: number,
  myId: number
) {
  const id = Number(userId);
  return (
    id > 0 &&
    !!myId &&
    id !== Number(myId) &&
    !blockList.nonBlockableIds.has(id)
  );
}
