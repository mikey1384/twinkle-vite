import { AiCostRow } from '../types';

export function numberValue(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

export function formatUsd(value: unknown) {
  return `$${numberValue(value).toFixed(4)}`;
}

export function formatNumber(value: unknown) {
  return Math.floor(numberValue(value)).toLocaleString();
}

export function formatCompact(value: unknown) {
  return Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(numberValue(value));
}

export function formatTime(value: number) {
  if (!value) return '';
  return new Date(value * 1000).toLocaleString();
}

// Fraction of input-side tokens served from the prompt cache. The backend
// supplies `cacheEligibleInputTokens` as a provider-aware denominator (Anthropic
// counts cache reads on top of input; OpenAI/Google fold them into input), so a
// single division is correct at every aggregation level. Returns null when the
// row has no eligible input tokens (e.g. rows that predate the field).
export function cacheHitRate(row: {
  cachedInputTokens?: number;
  cacheEligibleInputTokens?: number;
}) {
  const eligible = numberValue(row?.cacheEligibleInputTokens);
  if (eligible <= 0) return null;
  return numberValue(row?.cachedInputTokens) / eligible;
}

export function formatCacheHitRate(row: {
  cachedInputTokens?: number;
  cacheEligibleInputTokens?: number;
}) {
  const rate = cacheHitRate(row);
  if (rate === null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatCell(value: unknown) {
  if (typeof value === 'number') return formatNumber(value);
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function normalizeToken(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function formatTokenLabel(value: unknown) {
  const text = normalizeToken(value);
  if (!text) return '—';
  return text
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'ai') return 'AI';
      if (lower === 'tts') return 'TTS';
      if (lower === 'usd') return 'USD';
      if (lower === 'id') return 'ID';
      return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

export function formatBillingPolicy(value: unknown) {
  const policy = normalizeToken(value).toLowerCase();
  if (policy === 'ai_energy') return 'AI Energy';
  if (policy === 'system_covered') return 'System covered';
  if (policy === 'system_covered_failure') return 'System covered failure';
  if (policy === 'free_helper') return 'Free helper';
  if (policy === 'free_product') return 'Free product';
  if (policy === 'retry_fallback_recovery') return 'Retry recovery';
  if (policy === 'private_key_excluded') return 'Private key';
  return formatTokenLabel(value);
}

export function inferProviderFromModel(model: unknown) {
  const normalizedModel = normalizeToken(model).toLowerCase();
  if (
    normalizedModel.startsWith('gpt') ||
    normalizedModel.startsWith('o1') ||
    normalizedModel.startsWith('o3') ||
    normalizedModel.startsWith('o4') ||
    normalizedModel.startsWith('text-embedding') ||
    normalizedModel.startsWith('tts') ||
    normalizedModel.startsWith('whisper') ||
    normalizedModel.startsWith('gpt-image')
  ) {
    return 'openai';
  }
  if (normalizedModel.startsWith('claude')) return 'anthropic';
  if (normalizedModel.startsWith('gemini')) return 'google';
  return '';
}

export function formatProviderName(value: unknown, row?: AiCostRow) {
  const provider =
    normalizeToken(value).toLowerCase() || inferProviderFromModel(row?.model);
  const resolvedProvider =
    provider === 'unknown' ? inferProviderFromModel(row?.model) : provider;
  if (resolvedProvider === 'openai') return 'OpenAI';
  if (resolvedProvider === 'anthropic') return 'Anthropic';
  if (resolvedProvider === 'google') return 'Google';
  if (resolvedProvider) return formatTokenLabel(resolvedProvider);
  return 'No provider captured';
}

export function formatProviderModel(value: unknown, row?: AiCostRow) {
  const model = normalizeToken(value);
  if (!model) return 'No model captured';
  const provider = normalizeToken(row?.provider).toLowerCase();
  if (model === 'containers') return 'Code containers';
  if (model === 'files') {
    return provider === 'anthropic' ? 'Claude files' : 'Files API';
  }
  return model;
}

export function formatAccountName({
  value,
  row
}: {
  value: unknown;
  row: AiCostRow;
}) {
  const username = typeof value === 'string' ? value.trim() : '';
  if (username) return username;
  return row.userId ? `User ${row.userId}` : 'System';
}

export function getRowEmail(row: AiCostRow) {
  return String(
    row.accountVerifiedEmail || row.verifiedEmail || row.email || ''
  )
    .trim()
    .toLowerCase();
}

export function hasBucketEvidence(row: AiCostRow) {
  return Boolean(
    Number(row.userId || 0) || getRowEmail(row) || getEventSignals(row).length
  );
}

export function getBucketLabelForRow(row: AiCostRow) {
  const username = String(row.username || '').trim();
  const email = getRowEmail(row);
  const userId = Number(row.userId || 0);
  if (username && userId) return `${username} (${userId})`;
  if (email) return email;
  if (userId) return `User ${userId}`;
  const [signal] = getEventSignals(row);
  return signal
    ? `${signal.riskKeyType} ${signal.riskKeyHash.slice(0, 8)}`
    : '';
}

export function getEventSignalLabel(row: AiCostRow) {
  const signals = getEventSignals(row);
  if (signals.length === 0) return '';
  const typeLabels = Array.from(
    new Set(signals.map((signal) => signal.riskKeyType))
  );
  return `${formatNumber(signals.length)} ${typeLabels.join(', ')}`;
}

export function getEventSignals(row: AiCostRow) {
  const signalPairs = String(row.sharedRiskKeys || '')
    .split('|')
    .map((pair) => pair.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  return signalPairs
    .map((pair) => {
      const separatorIndex = pair.lastIndexOf(':');
      if (separatorIndex <= 0) return null;
      const riskKeyType = pair.slice(0, separatorIndex).trim();
      const riskKeyHash = pair
        .slice(separatorIndex + 1)
        .trim()
        .toLowerCase();
      if (!riskKeyType || !/^[a-f0-9]{64}$/.test(riskKeyHash)) return null;
      const key = `${riskKeyType}:${riskKeyHash}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { riskKeyType, riskKeyHash };
    })
    .filter(Boolean) as { riskKeyType: string; riskKeyHash: string }[];
}

export function getEventActionKey(row: AiCostRow) {
  return `${row.source || ''}:${Number(row.eventId || row.id || 0)}`;
}

export function shortenHash(value: string) {
  if (value.length <= 16) return value || '—';
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function getWidthPercent(value: unknown, maxValue: number) {
  if (maxValue <= 0) return 0;
  return Math.max(3, Math.min(100, (numberValue(value) / maxValue) * 100));
}

export function getRowKey(row: AiCostRow, rowIndex: number) {
  return [
    row.eventId,
    row.source,
    row.dayIndex,
    row.userId,
    row.identityKey,
    row.riskKeyType,
    row.riskKeyHash,
    row.surface,
    row.operation,
    row.createdAt,
    rowIndex
  ]
    .filter((value) => value !== undefined && value !== '')
    .join(':');
}

export function getRiskGroupSelectionKey(row: {
  riskKeyType?: string;
  riskKeyHash?: string;
}) {
  return `${row.riskKeyType || ''}:${row.riskKeyHash || ''}`;
}

export function getRiskGroupRowKey(row: AiCostRow) {
  return getRiskGroupSelectionKey(row);
}
