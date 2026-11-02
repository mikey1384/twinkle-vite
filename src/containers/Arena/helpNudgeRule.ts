// When HelpNudge offers Zero/Ciel's help: four quiet minutes with nothing
// answered, or half the time gone with under a quarter answered.
const FIRST_NUDGE_SECONDS = 4 * 60;

export function shouldNudge({
  elapsed,
  limit,
  answered,
  total
}: {
  elapsed: number;
  limit: number | null;
  answered: number;
  total: number;
}) {
  if (!total || answered >= total) return false;
  if (answered === 0 && elapsed >= FIRST_NUDGE_SECONDS) return true;
  return !!limit && elapsed >= limit / 2 && answered < total / 4;
}
