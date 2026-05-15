import { formatBytes } from '../ChatPanel/helpers/utils';

export interface RuntimeAssetTransferProgressPayload {
  operation?: string;
  operationId: string;
  sourceBuildId: number;
  sourceUserId: number;
  targetBuildId: number;
  targetUserId: number;
  status: 'running' | 'complete' | 'error';
  phase: 'preparing' | 'copying' | 'finalizing' | 'complete' | 'error';
  copiedAssets: number;
  totalAssets: number;
  copiedBytes: number;
  totalBytes: number;
  progressPercent: number;
  currentAssetId?: number | null;
  currentFileName?: string | null;
  partNumber?: number | null;
  partCount?: number | null;
  multipart?: boolean;
  message?: string;
}

export function createRuntimeAssetTransferOperationId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `asset_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function normalizeRuntimeAssetTransferProgressPayload(
  payload: any
): RuntimeAssetTransferProgressPayload | null {
  const operationId = String(payload?.operationId || '').trim();
  if (!operationId) return null;

  const copiedBytes = normalizeNonNegativeNumber(payload?.copiedBytes);
  const totalBytes = normalizeNonNegativeNumber(payload?.totalBytes);
  const copiedAssets = normalizeNonNegativeNumber(payload?.copiedAssets);
  const totalAssets = normalizeNonNegativeNumber(payload?.totalAssets);
  const rawProgressPercent = Number(payload?.progressPercent);
  const progressPercent = Number.isFinite(rawProgressPercent)
    ? Math.max(0, Math.min(100, rawProgressPercent))
    : calculateFallbackProgressPercent({
        copiedAssets,
        totalAssets,
        copiedBytes,
        totalBytes
      });

  return {
    operation: String(payload?.operation || '').trim() || undefined,
    operationId,
    sourceBuildId: normalizeNonNegativeNumber(payload?.sourceBuildId),
    sourceUserId: normalizeNonNegativeNumber(payload?.sourceUserId),
    targetBuildId: normalizeNonNegativeNumber(payload?.targetBuildId),
    targetUserId: normalizeNonNegativeNumber(payload?.targetUserId),
    status: normalizeStatus(payload?.status),
    phase: normalizePhase(payload?.phase),
    copiedAssets,
    totalAssets,
    copiedBytes,
    totalBytes,
    progressPercent,
    currentAssetId: normalizeNullableNumber(payload?.currentAssetId),
    currentFileName: String(payload?.currentFileName || '').trim() || null,
    partNumber: normalizeNullableNumber(payload?.partNumber),
    partCount: normalizeNullableNumber(payload?.partCount),
    multipart: Boolean(payload?.multipart),
    message: String(payload?.message || '').trim() || undefined
  };
}

export function formatRuntimeAssetTransferProgressLabel(
  progress: RuntimeAssetTransferProgressPayload
) {
  const message =
    progress.message ||
    (progress.phase === 'finalizing'
      ? 'Finalizing runtime assets'
      : 'Copying runtime assets');
  const fileCount =
    progress.totalAssets > 0
      ? `${Math.min(progress.copiedAssets, progress.totalAssets)}/${
          progress.totalAssets
        } files`
      : '';
  const byteCount =
    progress.totalBytes > 0
      ? `${formatBytes(Math.min(progress.copiedBytes, progress.totalBytes))} / ${formatBytes(
          progress.totalBytes
        )}`
      : '';
  return [message, fileCount, byteCount].filter(Boolean).join(' - ');
}

function normalizeNonNegativeNumber(value: any) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.floor(number);
}

function normalizeNullableNumber(value: any) {
  const number = normalizeNonNegativeNumber(value);
  return number > 0 ? number : null;
}

function normalizeStatus(
  value: any
): RuntimeAssetTransferProgressPayload['status'] {
  return value === 'complete' || value === 'error' ? value : 'running';
}

function normalizePhase(
  value: any
): RuntimeAssetTransferProgressPayload['phase'] {
  return value === 'preparing' ||
    value === 'copying' ||
    value === 'finalizing' ||
    value === 'complete' ||
    value === 'error'
    ? value
    : 'copying';
}

function calculateFallbackProgressPercent({
  copiedAssets,
  totalAssets,
  copiedBytes,
  totalBytes
}: {
  copiedAssets: number;
  totalAssets: number;
  copiedBytes: number;
  totalBytes: number;
}) {
  if (totalBytes > 0) {
    return Math.max(0, Math.min(100, (copiedBytes / totalBytes) * 100));
  }
  if (totalAssets > 0) {
    return Math.max(0, Math.min(100, (copiedAssets / totalAssets) * 100));
  }
  return 0;
}
