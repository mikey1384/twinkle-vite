// Deterministic task UI, never an assistant-authored message. All state comes
// from the saved server card; a successful tap alone does not mean task done.
export function describeAsyncTaskCard(card: {
  asyncTask?: { state?: string };
  status?: string;
}): string | undefined {
  if (!card.asyncTask) return undefined;
  if (card.status === 'pending') return 'Waiting for your approval.';
  switch (card.asyncTask.state) {
    case 'active':
      return 'Task saved. The next step will appear here.';
    case 'dispatching':
      return 'Working on this step. You can leave the chat.';
    case 'completed':
      return 'Task complete.';
    case 'cancelled':
      return 'Remaining steps stopped.';
    case 'needs_review':
      return 'This task needs a fresh look. Ask Zero or Ciel to check it.';
    default:
      return card.status === 'declined' ? 'Not saved.' : undefined;
  }
}

// HTTP replies and socket snapshots can arrive out of order. Keep the newest
// server revision; never synthesize task state locally.
export function newestAsyncTaskCard<
  T extends { asyncTask?: { id?: string; stateRevision?: number } }
>(previous: T | null | undefined, incoming: T): T {
  return previous?.asyncTask?.id &&
    previous.asyncTask.id === incoming?.asyncTask?.id &&
    Number(previous.asyncTask.stateRevision || 0) >
      Number(incoming.asyncTask.stateRevision || 0)
    ? previous
    : incoming;
}
