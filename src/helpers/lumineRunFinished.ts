// "Lumine finished" notices (Mikey 11-24). The API sends build_run_finished to
// the member's notification room when a Lumine run they started ends.

export interface LumineRunFinishedNotice {
  buildId: number;
  requestId: string | null;
  title: string | null;
  outcome: 'saved' | 'unchanged' | 'stopped' | 'failed';
  versionNumber: number | null;
  unfinished: boolean;
  message: string | null;
  finishedAt?: number;
}

export const LUMINE_RUN_FINISHED_EVENT = 'build_run_finished';
export const LUMINE_RUN_TITLE_PREFIX = '✓ Lumine finished · ';

export function normalizeLumineRunFinishedNotice(
  value: unknown
): LumineRunFinishedNotice | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, any>;
  const buildId = Math.floor(Number(raw.buildId));
  const outcome = raw.outcome;
  if (!(buildId > 0)) return null;
  if (!['saved', 'unchanged', 'stopped', 'failed'].includes(outcome)) return null;
  return {
    buildId,
    requestId: String(raw.requestId || '').trim() || null,
    title: String(raw.title || '').trim() || null,
    outcome,
    versionNumber: Number(raw.versionNumber) > 0 ? Number(raw.versionNumber) : null,
    unfinished: Boolean(raw.unfinished),
    message: String(raw.message || '').trim() || null,
    finishedAt: Number(raw.finishedAt) || undefined
  };
}

// Is this the build's own page (where Lumine's result already shows)?
export function isLumineBuildPage(pathname: string, buildId: number) {
  const match = /^\/build\/(\d+)(?:\/|$)/.exec(String(pathname || ''));
  return Boolean(match) && Number(match![1]) === buildId;
}

export function describeLumineRunFinished(notice: LumineRunFinishedNotice) {
  const name = notice.title || 'Your project';
  const version = notice.versionNumber ? ` (version ${notice.versionNumber})` : '';
  switch (notice.outcome) {
    case 'saved':
      return notice.unfinished
        ? {
            title: 'Lumine saved part of it',
            message: `${name}: saved so far${version}, but Lumine stopped before finishing.`,
            success: true
          }
        : {
            title: 'Your app is ready!',
            message: notice.versionNumber
              ? `${name}: version ${notice.versionNumber} saved.`
              : `${name}: Lumine's changes are saved.`,
            success: true
          };
    case 'unchanged':
      return {
        title: 'Lumine is done',
        message: `${name}: finished without changing anything this time.`,
        success: false
      };
    case 'stopped':
      return {
        title: 'Lumine stopped',
        message: `${name}: the run was stopped.`,
        success: false
      };
    case 'failed':
    default:
      return {
        title: 'Lumine stopped',
        message: `${name}: ${notice.message || 'something went wrong. You can try again.'}`,
        success: false
      };
  }
}
