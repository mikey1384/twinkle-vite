const BUILD_PROFILE_PIC_URL_MAX_LENGTH = 2048;
const ABSOLUTE_URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function toBuildProfilePicUrl({
  src,
  assetOrigin
}: {
  src: unknown;
  assetOrigin: string;
}): string | null {
  if (typeof src !== 'string') return null;
  const value = src.trim();
  if (
    !value ||
    value.length > BUILD_PROFILE_PIC_URL_MAX_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    value.includes('\\') ||
    value.startsWith('//')
  ) {
    return null;
  }

  const isAbsoluteUrl = ABSOLUTE_URL_SCHEME_PATTERN.test(value);
  if (isAbsoluteUrl && !/^https:\/\//i.test(value)) return null;

  try {
    const url = isAbsoluteUrl
      ? new URL(value)
      : new URL(value.startsWith('/') ? value : `/${value}`, assetOrigin);
    if (
      url.protocol !== 'https:' ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.href.length > BUILD_PROFILE_PIC_URL_MAX_LENGTH
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
