export const MAX_BUILD_APP_REFERENCES = 2;

export interface BuildAppReference {
  id: number;
  title: string;
  username?: string;
  thumbnailUrl?: string | null;
  relationship?: 'own' | 'team';
}

const referenceSection = 'Referenced apps:\n';

// Ordinary app links keep references attached through the existing queue,
// retries, persisted transcript and model history without a second payload
// that can drift away from its message. Only this exact leading block is
// rendered as chips; other links and malformed blocks remain normal text.
export function formatBuildAppReferenceMessage(
  message: string,
  apps: BuildAppReference[]
) {
  if (!apps.length) return message;
  return (
    referenceSection +
    apps
      .map((app) => {
        const title = app.title
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/[\\[\]<>`*_]/g, '\\$&');
        const owner = app.username
          ? ` "by:${encodeURIComponent(app.username)}"`
          : '';
        return `- [${title}](/build/${app.id}${owner})`;
      })
      .join('\n') +
    '\n\n' +
    message.trim()
  );
}

export function parseBuildAppReferenceMessage(content: string): {
  text: string;
  apps: BuildAppReference[];
} {
  const unchanged = { text: content, apps: [] };
  if (!content.startsWith(referenceSection)) return unchanged;
  const end = content.indexOf('\n\n', referenceSection.length);
  if (end < 0) return unchanged;
  const lines = content.slice(referenceSection.length, end).split('\n');
  if (!lines.length || lines.length > MAX_BUILD_APP_REFERENCES)
    return unchanged;
  const apps: BuildAppReference[] = [];
  for (const line of lines) {
    const match =
      /^- \[((?:\\.|[^\]\\])+)\]\(\/build\/([1-9]\d*)(?: "by:([^"]*)")?\)$/.exec(
        line
      );
    if (!match) return unchanged;
    const id = Number(match[2]);
    if (!Number.isSafeInteger(id) || apps.some((app) => app.id === id))
      return unchanged;
    try {
      apps.push({
        id,
        title: match[1].replace(/\\([\\[\]<>`*_])/g, '$1'),
        ...(match[3] ? { username: decodeURIComponent(match[3]) } : {})
      });
    } catch {
      return unchanged;
    }
  }
  return { text: content.slice(end + 2), apps };
}

export function getBuildAppReferenceLabel(
  app: BuildAppReference,
  apps: BuildAppReference[]
) {
  const duplicates = apps.filter(
    (entry) => entry.id !== app.id && entry.title === app.title
  );
  if (!duplicates.length) return app.title;
  if (
    app.username &&
    duplicates.every((entry) => entry.username !== app.username)
  ) {
    return `${app.title} · ${app.username}`;
  }
  return `${app.title} (#${app.id})`;
}
