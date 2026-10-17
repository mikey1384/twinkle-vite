// The reward day is the site's UTC day (rewardDay on the server).
export function getDigestDayLabel(dayKey: string, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  if (dayKey === today) return 'Today';
  const yesterday = new Date(now - 86400000).toISOString().slice(0, 10);
  if (dayKey === yesterday) return 'Yesterday';
  const date = new Date(`${dayKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// "Mina, Joon, +6": who earned their first reward in the app today. Shown
// only for two or more (one newcomer has their own card).
export function formatNewcomers(
  newcomers?: { count?: number; names?: string[] } | null
) {
  const count = Math.max(0, Math.floor(Number(newcomers?.count) || 0));
  const names = (newcomers?.names || []).filter(Boolean).slice(0, 2);
  if (count < 2 || !names.length) return '';
  const rest = count - names.length;
  return `${names.join(', ')}${rest > 0 ? `, +${rest}` : ''}`;
}
