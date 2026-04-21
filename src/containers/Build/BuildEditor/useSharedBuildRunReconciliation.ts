import { useRef } from 'react';

interface SharedRunStreamSyncState {
  previousSyncKey: string;
  isInitialSync: boolean;
  didChange: boolean;
}

interface SharedRunStatusSyncOptions {
  requestId: string;
  status: string;
  assistantStatusStepCount: number;
}

interface SharedRunReplicaCheckOptions {
  buildId: number;
  updatedAt: number | null | undefined;
}

interface SharedRunEventLike {
  id?: string | null;
  kind?: string | null;
  phase?: string | null;
  message?: string | null;
  createdAt?: number | null;
}

interface RuntimeVerifyResultLike {
  requestId?: string | null;
  status?: string | null;
}

interface SharedBuildRunReconciliationApi {
  reset(): void;
  recordSharedRunStreamSync(nextStreamSyncKey: string): SharedRunStreamSyncState;
  claimSharedRunStatusSync(options: SharedRunStatusSyncOptions): boolean;
  consumeUnprocessedSharedRunEvents<T extends SharedRunEventLike>(args: {
    requestId: string;
    runEvents: T[];
  }): T[];
  claimSharedRunReplicaCheck(options: SharedRunReplicaCheckOptions): boolean;
  resetSharedRunReplicaCheck(): void;
  claimRuntimeVerifyResult(result: RuntimeVerifyResultLike): boolean;
}

function getSharedRunEventProcessingKey(event: SharedRunEventLike) {
  const normalizedId = String(event?.id || '').trim();
  if (normalizedId) return normalizedId;
  return [
    String(event?.kind || ''),
    String(event?.phase || ''),
    String(event?.message || ''),
    Number(event?.createdAt || 0)
  ].join(':');
}

function getRuntimeVerifyResultProcessingKey(
  runtimeVerifyResult: RuntimeVerifyResultLike
) {
  return [
    String(runtimeVerifyResult.requestId || '').trim(),
    runtimeVerifyResult.status
  ].join(':');
}

export default function useSharedBuildRunReconciliation() {
  const sharedRunReplicaCheckKeyRef = useRef('');
  const sharedRunStatusSyncKeyRef = useRef('');
  const sharedRunStreamSyncKeyRef = useRef('');
  const sharedRunEventRequestIdRef = useRef('');
  const processedSharedRunEventIdsRef = useRef<Set<string>>(new Set());
  const processedRuntimeVerifyResultKeysRef = useRef<Set<string>>(new Set());
  const apiRef = useRef<SharedBuildRunReconciliationApi | null>(null);

  if (!apiRef.current) {
    apiRef.current = {
      reset() {
        sharedRunReplicaCheckKeyRef.current = '';
        sharedRunStatusSyncKeyRef.current = '';
        sharedRunStreamSyncKeyRef.current = '';
        sharedRunEventRequestIdRef.current = '';
        processedSharedRunEventIdsRef.current = new Set();
        processedRuntimeVerifyResultKeysRef.current = new Set();
      },

      recordSharedRunStreamSync(nextStreamSyncKey: string) {
        const normalizedNextStreamSyncKey = String(nextStreamSyncKey || '');
        const previousSyncKey = sharedRunStreamSyncKeyRef.current;
        sharedRunStreamSyncKeyRef.current = normalizedNextStreamSyncKey;
        return {
          previousSyncKey,
          isInitialSync: !previousSyncKey,
          didChange: previousSyncKey !== normalizedNextStreamSyncKey
        };
      },

      claimSharedRunStatusSync({
        requestId,
        status,
        assistantStatusStepCount
      }: SharedRunStatusSyncOptions) {
        const nextStatusSyncKey = [
          requestId,
          status,
          assistantStatusStepCount
        ].join(':');
        if (sharedRunStatusSyncKeyRef.current === nextStatusSyncKey) {
          return false;
        }
        sharedRunStatusSyncKeyRef.current = nextStatusSyncKey;
        return true;
      },

      consumeUnprocessedSharedRunEvents<T extends SharedRunEventLike>({
        requestId,
        runEvents
      }: {
        requestId: string;
        runEvents: T[];
      }) {
        if (sharedRunEventRequestIdRef.current !== requestId) {
          sharedRunEventRequestIdRef.current = requestId;
          processedSharedRunEventIdsRef.current = new Set(
            runEvents.map(getSharedRunEventProcessingKey)
          );
          return [];
        }
        const unprocessedRunEvents: T[] = [];
        for (const runEvent of runEvents) {
          const runEventKey = getSharedRunEventProcessingKey(runEvent);
          if (processedSharedRunEventIdsRef.current.has(runEventKey)) {
            continue;
          }
          processedSharedRunEventIdsRef.current.add(runEventKey);
          unprocessedRunEvents.push(runEvent);
        }
        return unprocessedRunEvents;
      },

      claimSharedRunReplicaCheck({
        buildId,
        updatedAt
      }: SharedRunReplicaCheckOptions) {
        const sharedRunKey = `${buildId}:${updatedAt}`;
        if (sharedRunReplicaCheckKeyRef.current === sharedRunKey) {
          return false;
        }
        sharedRunReplicaCheckKeyRef.current = sharedRunKey;
        return true;
      },

      resetSharedRunReplicaCheck() {
        sharedRunReplicaCheckKeyRef.current = '';
      },

      claimRuntimeVerifyResult(runtimeVerifyResult: RuntimeVerifyResultLike) {
        const processingKey =
          getRuntimeVerifyResultProcessingKey(runtimeVerifyResult);
        if (processedRuntimeVerifyResultKeysRef.current.has(processingKey)) {
          return false;
        }
        processedRuntimeVerifyResultKeysRef.current.add(processingKey);
        return true;
      }
    };
  }

  return apiRef.current;
}
