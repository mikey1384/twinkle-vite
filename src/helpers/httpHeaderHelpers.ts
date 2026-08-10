export function getHttpHeaderValue(headers: unknown, name: string) {
  if (!headers || typeof headers !== 'object') return '';

  const headerCollection = headers as {
    get?: (headerName: string) => unknown;
    [key: string]: unknown;
  };

  if (typeof headerCollection.get === 'function') {
    try {
      const value = headerCollection.get(name);
      if (value != null) return String(value).trim();
    } catch {
      // Fall through to plain-object lookup for non-standard header bags.
    }
  }

  const normalizedName = name.toLowerCase();
  for (const [key, value] of Object.entries(headerCollection)) {
    if (key.toLowerCase() === normalizedName && value != null) {
      return String(value).trim();
    }
  }

  return '';
}

export function normalizeAuthorizationToken(value: unknown) {
  const header = String(value || '').trim();
  if (!header) return '';
  const bearerPrefix = 'bearer ';
  if (header.toLowerCase().startsWith(bearerPrefix)) {
    return header.slice(bearerPrefix.length).trim();
  }
  return header;
}
