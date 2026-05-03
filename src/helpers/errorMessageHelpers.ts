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
