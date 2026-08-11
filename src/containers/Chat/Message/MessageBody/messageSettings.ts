export function parseMessageSettings(settings: unknown): Record<string, any> {
  if (typeof settings === 'string') {
    try {
      const parsed = JSON.parse(settings);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? (settings as Record<string, any>)
    : {};
}
