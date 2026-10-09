export function readGrammarblesSettings(settings: unknown): {
  sound?: boolean;
  music?: boolean;
} {
  let parsed: any = settings;
  if (typeof settings === 'string') {
    try {
      parsed = JSON.parse(settings);
    } catch {
      parsed = null;
    }
  }
  return (parsed && typeof parsed === 'object' && parsed.grammarbles) || {};
}
