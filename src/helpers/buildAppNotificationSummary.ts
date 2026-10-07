// A Build app's notification summary is shown right after the acting
// member's username ("Liki" + summary). Apps sometimes write the name into the
// summary too ("Liki responded to …"), which read "Liki Liki responded …".
// Drop that leading name (and a following colon) when it matches the actor;
// any other summary is shown unchanged. A possessive ("Liki's tower …") is
// kept as is: stripping it would read "Liki tower …" after the username.
export function stripLeadingActorName(
  summary: string,
  actorUsername?: string | null
) {
  const text = String(summary || '');
  const name = String(actorUsername || '').trim();
  if (!name) return text;
  const trimmed = text.trimStart();
  if (trimmed.slice(0, name.length).toLowerCase() !== name.toLowerCase()) {
    return text;
  }
  const rest = trimmed.slice(name.length);
  // only a whole-word match: "Liki responded" yes, "Likiko responded" no
  const match = rest.match(/^:?\s+/);
  if (!match) return text;
  const stripped = rest.slice(match[0].length);
  return stripped || text;
}
