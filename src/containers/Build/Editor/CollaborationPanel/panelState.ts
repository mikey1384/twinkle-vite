export function normalizePanelScrollTop(value: unknown) {
  const scrollTop = Number(value || 0);
  if (!Number.isFinite(scrollTop)) return 0;
  return Math.max(0, Math.floor(scrollTop));
}

export function normalizePanelForumThreadId(value: unknown) {
  const threadId = Number(value || 0);
  if (!Number.isFinite(threadId)) return 0;
  return Math.max(0, Math.floor(threadId));
}
