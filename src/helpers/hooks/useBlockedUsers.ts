import { useEffect, useSyncExternalStore } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  ADMIN_USER_ID,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import {
  EMPTY_BLOCK_LIST_STATE,
  applyBlockListResponse,
  emptyBlockListState,
  getBlockListSnapshot,
  setBlockListState,
  setFallbackNonBlockableIds,
  subscribeBlockList
} from '~/helpers/blockList';

export type { BlockedUser, BlockListState } from '~/helpers/blockList';
export { canBlockUser, isBlockedByMe } from '~/helpers/blockList';

setFallbackNonBlockableIds([ZERO_TWINKLE_ID, CIEL_TWINKLE_ID, ADMIN_USER_ID]);

let inflight: { ownerId: number; promise: Promise<void> } | null = null;
let lastFailure = { ownerId: 0, at: 0 };
const RETRY_AFTER_FAILURE_MS = 30_000;

function ensureLoaded(
  ownerId: number,
  loadBlockedUsers: () => Promise<any>
) {
  if (inflight?.ownerId === ownerId) return;
  const state = getBlockListSnapshot();
  if (state.ownerId === ownerId) {
    if (state.status === 'loading' || state.status === 'loaded') return;
    if (
      state.status === 'error' &&
      lastFailure.ownerId === ownerId &&
      Date.now() - lastFailure.at < RETRY_AFTER_FAILURE_MS
    ) {
      return;
    }
  }
  setBlockListState({ ...emptyBlockListState(ownerId), status: 'loading' });
  const promise = (async () => {
    try {
      const data = await loadBlockedUsers();
      if (getBlockListSnapshot().ownerId === ownerId) {
        applyBlockListResponse(ownerId, data);
      }
    } catch (error) {
      console.error('Failed to load blocked members:', error);
      lastFailure = { ownerId, at: Date.now() };
      if (getBlockListSnapshot().ownerId === ownerId) {
        setBlockListState({ ...emptyBlockListState(ownerId), status: 'error' });
      }
    } finally {
      if (inflight?.ownerId === ownerId) inflight = null;
    }
  })();
  inflight = { ownerId, promise };
}

export default function useBlockedUsers() {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const loadBlockedUsers = useAppContext(
    (v) => v.requestHelpers.loadBlockedUsers
  );
  const snapshot = useSyncExternalStore(subscribeBlockList, getBlockListSnapshot);

  useEffect(() => {
    if (!myId) return;
    ensureLoaded(myId, loadBlockedUsers);
    // The request helper is stable and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  return snapshot.ownerId === myId && myId ? snapshot : EMPTY_BLOCK_LIST_STATE;
}

export function useBlockActions() {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const blockUserRequest = useAppContext((v) => v.requestHelpers.blockUser);
  const unblockUserRequest = useAppContext(
    (v) => v.requestHelpers.unblockUser
  );
  return { blockUser, unblockUser };

  async function blockUser(userId: number) {
    const data = await blockUserRequest(userId);
    applyBlockListResponse(myId, data);
  }

  async function unblockUser(userId: number) {
    const data = await unblockUserRequest(userId);
    applyBlockListResponse(myId, data);
  }
}
