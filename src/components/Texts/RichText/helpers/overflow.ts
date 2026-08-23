const overflowTolerancePx = 1;

export function resolveInitialRichTextPresentationState({
  cachedState,
  contentRevision,
  isPreview,
  isStreaming
}: {
  cachedState?: {
    contentRevision?: string;
    isExpanded?: boolean;
  };
  contentRevision: string;
  isPreview?: boolean;
  isStreaming?: boolean;
}) {
  const cachedExpansionMatchesContent =
    !isPreview &&
    !isStreaming &&
    cachedState?.contentRevision === contentRevision;

  const isExpanded = Boolean(
    cachedExpansionMatchesContent && cachedState?.isExpanded
  );

  return {
    isExpanded,
    // Expansion is user intent, but overflow belongs to the current DOM
    // layout. Even restored content must remeasure before showing a control.
    isOverflown: null as boolean | null
  };
}

export function resolveInitialRichTextHeight({
  cachedState,
  contentRevision,
  isPreview,
  isStreaming
}: {
  cachedState?: {
    contentRevision?: string;
    height?: number;
  };
  contentRevision: string;
  isPreview?: boolean;
  isStreaming?: boolean;
}) {
  if (
    isPreview ||
    isStreaming ||
    cachedState?.contentRevision !== contentRevision
  ) {
    return undefined;
  }
  return typeof cachedState.height === 'number' ? cachedState.height : undefined;
}

export function applyRichTextOverflowMeasurement({
  state,
  isOverflown
}: {
  state: {
    isExpanded: boolean;
    isOverflown: boolean | null;
  };
  isOverflown: boolean;
}) {
  if (state.isOverflown === isOverflown) {
    return state;
  }
  return {
    ...state,
    isOverflown
  };
}

export function shouldShowRichTextFully({
  isExpanded,
  isOverflown,
  isPreview
}: {
  isExpanded: boolean;
  isOverflown: boolean | null;
  isPreview?: boolean;
}) {
  return !isPreview && (isExpanded || isOverflown === false);
}

export function resolveRichTextHeightToPersist({
  contentRevision,
  height,
  heightContentRevision
}: {
  contentRevision: string;
  height?: number;
  heightContentRevision: string | null;
}) {
  return heightContentRevision === contentRevision && typeof height === 'number'
    ? height
    : undefined;
}

export function resolveRichTextContentTransition({
  contentRevision,
  isStreaming,
  previousContentRevision,
  wasStreaming
}: {
  contentRevision: string;
  isStreaming: boolean;
  previousContentRevision: string;
  wasStreaming: boolean;
}): 'unchanged' | 'preserve-expansion' | 'reset' {
  if (
    previousContentRevision === contentRevision &&
    wasStreaming === isStreaming
  ) {
    return 'unchanged';
  }
  if (wasStreaming && !isStreaming) {
    return 'preserve-expansion';
  }
  return 'reset';
}

export function resolveRichTextCollapseThreshold({
  computedMaxHeight,
  fallbackClientHeight
}: {
  computedMaxHeight: string;
  fallbackClientHeight: number;
}) {
  const parsedMaxHeight = Number.parseFloat(computedMaxHeight);
  if (Number.isFinite(parsedMaxHeight) && parsedMaxHeight > 0) {
    return parsedMaxHeight;
  }
  return Math.max(0, fallbackClientHeight);
}

export function isRichTextMeasurementOverflown({
  scrollHeight,
  collapseThreshold,
  extraAllowedHeight = 0
}: {
  scrollHeight: number;
  collapseThreshold: number;
  extraAllowedHeight?: number;
}) {
  return (
    scrollHeight >
    collapseThreshold + Math.max(0, extraAllowedHeight) + overflowTolerancePx
  );
}
