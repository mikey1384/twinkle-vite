// The next authenticated bind carries the preceding client-side disconnect.
// No extra requests; page-local and account-scoped, with no chat/user text.
interface DisconnectEvidence {
  userId: number;
  socketId: string | null;
  reason: string;
  visibility: string;
  hiddenForMs: number | null;
  online: boolean;
}

export function createSocketReconnectEvidence(now = Date.now) {
  let previous: (DisconnectEvidence & { at: number }) | null = null;
  return {
    record(value: DisconnectEvidence) {
      previous = { ...value, at: now() };
    },
    forUser(userId: number) {
      if (!previous || previous.userId !== userId) return undefined;
      return {
        socketId: previous.socketId,
        reason: previous.reason,
        visibility: previous.visibility,
        hiddenForMs: previous.hiddenForMs,
        online: previous.online,
        ageMs: Math.max(0, now() - previous.at)
      };
    }
  };
}
