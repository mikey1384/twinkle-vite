export type CardWindowSize = {
  height: number;
  width: number;
};

export type CardWindowMeasurement = {
  key: string;
  size?: CardWindowSize;
};

export function resolveCardWindowMeasuredWidth(
  outerWidth: number,
  panelWidth: number
) {
  return outerWidth > 0 ? outerWidth : panelWidth;
}

export function shouldInvalidateCardWindowMeasurement(
  previous: CardWindowSize | undefined,
  outerWidth: number
) {
  return (
    outerWidth > 0 &&
    Boolean(previous) &&
    Math.abs((previous?.width || 0) - outerWidth) > 1
  );
}

export function getClearedCardMeasurementState(
  prev: CardWindowMeasurement,
  cacheKey: string
): CardWindowMeasurement {
  if (prev.key === cacheKey && prev.size === undefined) {
    return prev;
  }
  return { key: cacheKey };
}

export function getNextCardMeasurementState(
  prev: CardWindowMeasurement,
  cacheKey: string,
  next: CardWindowSize
): CardWindowMeasurement {
  if (
    prev.key === cacheKey &&
    prev.size?.height === next.height &&
    prev.size?.width === next.width
  ) {
    return prev;
  }
  return { key: cacheKey, size: next };
}
