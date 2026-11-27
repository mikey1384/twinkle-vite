export interface LumineRunPreviewData {
  kind: 'lumine_run';
  buildId: number;
  rootBuildId?: number;
  branchNumber?: number;
  needsContributionBranch?: boolean;
  appTitle: string;
  buildPath: string;
  instruction: string;
  estimatedEnergyPercent: number;
  estimatedEnergyUnits?: number;
  remainingEnergyPercent?: number;
  modeLabel?: string;
}

export function isLumineRunPreview(
  value: unknown
): value is LumineRunPreviewData {
  const preview = value as LumineRunPreviewData;
  return (
    !!preview &&
    preview.kind === 'lumine_run' &&
    Number.isFinite(Number(preview.buildId)) &&
    typeof preview.appTitle === 'string' &&
    typeof preview.buildPath === 'string' &&
    typeof preview.instruction === 'string' &&
    Number.isFinite(Number(preview.estimatedEnergyPercent))
  );
}

export function resolveLumineRunBuildPath(
  preview: LumineRunPreviewData,
  resultData?: any
) {
  const candidate =
    typeof resultData?.buildPath === 'string' && resultData.buildPath.trim()
      ? resultData.buildPath.trim()
      : preview.buildPath.trim();
  if (candidate.startsWith('/build') && !candidate.startsWith('//')) {
    return candidate;
  }
  return '/build';
}

export function getLumineRunCardButtonLabels() {
  return {
    approve: 'Start',
    decline: 'Not now'
  } as const;
}

export function describeLumineRunApprovalStatus(
  status?: string,
  result?: any
) {
  if (status === 'approved') {
    return result?.data?.waitingBehindOwnRun
      ? 'Queued for Lumine! You’ll get a notice when it finishes.'
      : 'Lumine started! You’ll get a notice when it finishes.';
  }
  if (status === 'declined') {
    return 'Okay, not started.';
  }
  if (status === 'failed') {
    if (typeof result?.error === 'string' && result.error) return result.error;
    if (typeof result?.data?.error === 'string' && result.data.error) {
      return result.data.error;
    }
    return 'Could not start Lumine.';
  }
  return undefined;
}
