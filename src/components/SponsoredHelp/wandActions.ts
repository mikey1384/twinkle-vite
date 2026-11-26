// Every wand card's actions, one model (Mikey 11-26): the server defines it
// where the card's plan is built (twinkle-api helpers/sponsoredHelp/
// wandActions.ts) and every wand card draws it with WandActionBar.
// - mainAction (always): runs the card's whole plan, every chapter in its
//   intended order. Its label is the card's ("Start the tour", "Do all of
//   these", "Have Zero help me", ...).
// - chapters (optional): jump to, or start at, one chapter of the same plan.
//   A card with one step has none.
// - backup (optional): the quiet text button beside the main one ("Maybe
//   later", "No thanks", ...).
// No app imports: node tests load it.

export type WandMainRuns = 'all';
export type WandBackupAction = 'decline' | 'later' | 'take_back' | 'close';

export interface WandActionModel {
  mainAction: { label: string; runs: WandMainRuns };
  // shown above the chips, e.g. "Take the tour with Zero:"
  chaptersTitle?: string;
  chapters?: { id: string; label: string }[];
  backup?: { label: string; action: WandBackupAction };
}

// The model as the card draws it: a missing or malformed one from an older
// API falls back to the card's own defaults; empty chapters and backups are
// dropped so the layout never keeps room for them.
export function resolveWandActions(
  fromServer: Partial<WandActionModel> | null | undefined,
  fallback: WandActionModel
): WandActionModel {
  const main =
    fromServer?.mainAction && typeof fromServer.mainAction.label === 'string' && fromServer.mainAction.label.trim()
      ? { label: fromServer.mainAction.label.trim(), runs: 'all' as const }
      : fallback.mainAction;
  const rawChapters = Array.isArray(fromServer?.chapters) ? fromServer!.chapters : fallback.chapters;
  const chapters = (rawChapters || []).filter(
    (chapter) => chapter && String(chapter.id || '') && String(chapter.label || '').trim()
  );
  const rawBackup = fromServer && 'backup' in fromServer ? fromServer.backup : fallback.backup;
  const backup = rawBackup && String(rawBackup.label || '').trim() ? rawBackup : undefined;
  return {
    mainAction: main,
    ...(chapters.length > 1
      ? { chapters, chaptersTitle: fromServer?.chaptersTitle || fallback.chaptersTitle }
      : {}),
    ...(backup ? { backup } : {})
  };
}
