import { useEffect, useState } from 'react';

export interface BuildUpdateNote {
  commentId: number;
  versionNumber: number;
  // "Update #N": the app's published updates up to this one.
  updateNumber: number;
  artifactVersionId: number;
  content: string;
  username: string;
  timeStamp: number;
}

// The owner's page posts the note right after the publish succeeds, so a
// player whose notice appeared at once (live apps get it over the socket)
// may look before it exists. A few spaced re-checks cover that; after them
// the notice simply stays as it always was.
export const UPDATE_NOTE_RECHECK_DELAYS_MS = [15_000, 45_000];

export function noteFromResponse(data: unknown, versionId: number) {
  const note = (data as { note?: any } | null)?.note;
  if (!note || typeof note !== 'object') return null;
  if (Number(note.artifactVersionId) !== versionId) return null;
  const content = String(note.content || '').trim();
  const commentId = Number(note.commentId || 0);
  if (!content || !commentId) return null;
  return {
    commentId,
    versionNumber: Number(note.versionNumber || 0),
    updateNumber: Number(note.updateNumber || 0),
    artifactVersionId: versionId,
    content,
    username: String(note.username || ''),
    timeStamp: Number(note.timeStamp || 0)
  } satisfies BuildUpdateNote;
}

export function useUpdateNote({
  buildId,
  versionId,
  active,
  loadNote
}: {
  buildId: number | null;
  versionId: number | null;
  active: boolean;
  loadNote: (args: { buildId: number; artifactVersionId: number }) => Promise<unknown>;
}) {
  const [found, setFound] = useState<BuildUpdateNote | null>(null);

  useEffect(() => {
    if (!active || !buildId || !versionId) return;
    if (found?.artifactVersionId === versionId) return;
    let stopped = false;
    let timer: number | null = null;
    let attempt = 0;
    const activeBuildId = buildId;
    const activeVersionId = versionId;
    check();
    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
    };

    function check() {
      void Promise.resolve()
        .then(() => loadNote({ buildId: activeBuildId, artifactVersionId: activeVersionId }))
        .then((data) => noteFromResponse(data, activeVersionId))
        .catch(() => null)
        .then((note) => {
          if (stopped) return;
          if (note) {
            setFound(note);
            return;
          }
          const delay = UPDATE_NOTE_RECHECK_DELAYS_MS[attempt];
          attempt += 1;
          if (delay !== undefined) timer = window.setTimeout(check, delay);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, buildId, versionId]);

  return found && found.artifactVersionId === versionId ? found : null;
}
