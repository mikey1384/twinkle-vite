function decodeBinaryErrorText(data: ArrayBuffer | ArrayBufferView) {
  try {
    const view =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new TextDecoder().decode(view);
  } catch {
    return '';
  }
}

function getStringMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
}

export function getErrorMessageFromResponseData(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) {
      return null;
    }
    try {
      return getErrorMessageFromResponseData(JSON.parse(trimmed)) || trimmed;
    } catch {
      return trimmed;
    }
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (!data) {
    return null;
  }

  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return getErrorMessageFromResponseData(decodeBinaryErrorText(data));
  }

  if (typeof data === 'object') {
    const errorData = data as {
      error?: unknown;
      message?: unknown;
    };

    return (
      getStringMessage(errorData.error) ||
      getStringMessage(errorData.message) ||
      getErrorMessageFromResponseData(errorData.error) ||
      getErrorMessageFromResponseData(errorData.message)
    );
  }

  return null;
}

export function getErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
) {
  const errorObj = error as {
    data?: unknown;
    message?: unknown;
    response?: {
      data?: unknown;
    };
  };

  return (
    getErrorMessageFromResponseData(errorObj?.response?.data) ||
    getErrorMessageFromResponseData(errorObj?.data) ||
    getStringMessage(errorObj?.message) ||
    getStringMessage(error) ||
    fallback
  );
}

const DECISION_REQUEST_ID_RE =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DECISION_REASON_RE = /^[a-z_]{2,40}$/;

export function parseRetryAfterSeconds(
  bodyValue: unknown,
  headers?: unknown
): number | undefined {
  if (
    typeof bodyValue === 'number' ||
    (typeof bodyValue === 'string' && bodyValue.trim() !== '')
  ) {
    const fromBody = Number(bodyValue);
    if (Number.isFinite(fromBody) && fromBody > 0) {
      return fromBody;
    }
  }

  let rawHeader: unknown;
  if (headers && typeof headers === 'object') {
    const headerRecord = headers as Record<string, unknown> & {
      get?: (name: string) => unknown;
    };
    rawHeader =
      typeof headerRecord.get === 'function'
        ? headerRecord.get('retry-after')
        : (headerRecord['retry-after'] ?? headerRecord['Retry-After']);
  }

  if (rawHeader == null) {
    return undefined;
  }

  const trimmedHeader = String(rawHeader).trim();
  if (!trimmedHeader) {
    return undefined;
  }

  const fromHeader = Number(trimmedHeader);
  if (Number.isFinite(fromHeader) && fromHeader > 0) {
    return fromHeader;
  }

  const parsedDate = Date.parse(trimmedHeader);
  if (Number.isFinite(parsedDate)) {
    const diffSeconds = Math.ceil((parsedDate - Date.now()) / 1000);
    if (diffSeconds > 0) {
      return diffSeconds;
    }
  }

  return undefined;
}

export function normalizeHttpRequestError(
  error: any,
  fallbackMessage = 'An unexpected error occurred'
) {
  if (error?.response) {
    const { status, data, headers } = error.response;
    const message = getErrorMessageFromResponseData(data) || fallbackMessage;
    const retryAfterSeconds = parseRetryAfterSeconds(
      data?.retryAfterSeconds,
      headers
    );
    return {
      status,
      message,
      ...(typeof data?.code === 'string' && data.code.trim()
        ? { code: data.code.trim() }
        : {}),
      ...(typeof data?.retryable === 'boolean'
        ? { retryable: data.retryable }
        : {}),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
      ...(data?.requiredVersion !== undefined
        ? { requiredVersion: data.requiredVersion }
        : {})
    };
  }

  if (
    error &&
    typeof error === 'object' &&
    !error.isAxiosError &&
    typeof error.status === 'number'
  ) {
    return error;
  }

  return {
    status: 500,
    message: getErrorMessage(error, fallbackMessage),
    isTransportError: true
  };
}

export function normalizeBuildRuntimeAiDecisionError(error: any) {
  const normalized = normalizeHttpRequestError(error, 'Decision failed');
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') {
    return normalized;
  }
  return {
    ...normalized,
    ...(typeof data.requestId === 'string' &&
    DECISION_REQUEST_ID_RE.test(data.requestId)
      ? { requestId: data.requestId }
      : {}),
    ...(typeof data.reason === 'string' && DECISION_REASON_RE.test(data.reason)
      ? { reason: data.reason }
      : {}),
    ...(data.aiUsagePolicy !== undefined
      ? { aiUsagePolicy: data.aiUsagePolicy }
      : {})
  };
}
