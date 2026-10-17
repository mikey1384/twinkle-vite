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
