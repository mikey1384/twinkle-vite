import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { useLocation } from 'react-router-dom';
import { useOutsideClick } from '~/helpers/hooks';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

const VIEWPORT_PADDING_PX = 12;
const BUBBLE_GAP_PX = 8;
const ARROW_EDGE_PADDING_PX = 16;
const DEFAULT_TOUCH_MOVE_DISMISS_THRESHOLD_PX = 10;

type FullTextRevealDirection = 'left' | 'right';
type FullTextRevealAlignment = 'center' | 'edge';
type FullTextRevealPlacement = 'top' | 'bottom';

interface FullTextRevealPosition {
  arrowLeft: number;
  left: number;
  placement: FullTextRevealPlacement;
  top: number;
}

export default function FullTextReveal({
  alignment = 'edge',
  anchorRef,
  dismissOnOutsidePress = true,
  dismissOnScroll = true,
  dismissTouchMoveThreshold = DEFAULT_TOUCH_MOVE_DISMISS_THRESHOLD_PX,
  direction = 'right',
  onDismiss,
  style,
  show,
  text,
  className
}: {
  alignment?: FullTextRevealAlignment;
  anchorRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  direction?: FullTextRevealDirection;
  dismissOnOutsidePress?: boolean;
  dismissOnScroll?: boolean;
  dismissTouchMoveThreshold?: number;
  onDismiss?: () => void;
  show: boolean;
  style?: React.CSSProperties;
  text: string | React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const routeKeyRef = useRef('');
  const location = useLocation();
  const [position, setPosition] = useState<FullTextRevealPosition | null>(null);
  const [computedWidth, setComputedWidth] = useState<string | undefined>(
    undefined
  );
  const routeKey = `${location.pathname}\n${location.search}\n${location.hash}`;
  const viewportMaxWidth = `calc(100vw - ${VIEWPORT_PADDING_PX * 2}px)`;
  const constrainedMaxWidth = useMemo(
    () =>
      getConstrainedCssSize({
        value: style?.maxWidth,
        fallback: `min(90vw, 36rem, ${viewportMaxWidth})`,
        viewportMaxWidth
      }),
    [style?.maxWidth, viewportMaxWidth]
  );
  const constrainedMinWidth = useMemo(
    () =>
      getConstrainedCssSize({
        value: style?.minWidth,
        fallback: `min(14rem, ${viewportMaxWidth})`,
        viewportMaxWidth
      }),
    [style?.minWidth, viewportMaxWidth]
  );
  const outsideClickRefs = useMemo(
    () => [anchorRef || containerRef, bubbleRef],
    [anchorRef]
  );

  const bubbleClass = useMemo(
    () =>
      css`
        position: fixed;
        z-index: 100000000; /* ensure always on top */
        padding: 0.8rem 1rem;
        font-size: 1.3rem;
        background: #fff;
        color: ${Color.black()};
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        box-shadow: 0 12px 20px -14px rgba(15, 23, 42, 0.22),
          0 1px 2px rgba(15, 23, 42, 0.06);
        box-sizing: border-box;
        min-width: min(14rem, calc(100vw - ${VIEWPORT_PADDING_PX * 2}px));
        width: max-content;
        max-width: min(90vw, 36rem, calc(100vw - ${VIEWPORT_PADDING_PX * 2}px));
        line-height: 1.5;
        word-break: keep-all;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        &::before {
          content: '';
          position: absolute;
          left: var(--full-text-reveal-arrow-left, 1.2rem);
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
        }
        &[data-placement='bottom']::before {
          top: -6px;
          border-bottom: 6px solid #fff;
          filter: drop-shadow(0 -1px 0 var(--ui-border));
        }
        &[data-placement='top']::before {
          bottom: -6px;
          border-top: 6px solid #fff;
          filter: drop-shadow(0 1px 0 var(--ui-border));
        }
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
          max-width: min(94vw, 36rem, calc(100vw - ${VIEWPORT_PADDING_PX * 2}px));
        }
      `,
    []
  );

  const computeCoords = useCallback(() => {
    const el = anchorRef?.current || containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const bubbleWidth = Math.ceil(
      bubbleRef.current?.offsetWidth ||
        Math.min(Math.max(rect.width, 160), window.innerWidth)
    );
    const bubbleHeight = Math.ceil(bubbleRef.current?.offsetHeight || 48);
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const anchorCenter = rect.left + rect.width / 2;
    const maxLeft = Math.max(
      VIEWPORT_PADDING_PX,
      viewportWidth - VIEWPORT_PADDING_PX - bubbleWidth
    );
    const preferredLeft =
      alignment === 'center'
        ? anchorCenter - bubbleWidth / 2
        : direction === 'left'
          ? rect.left
          : rect.right - bubbleWidth;
    const left = clamp(preferredLeft, VIEWPORT_PADDING_PX, maxLeft);
    const canFitAbove =
      rect.top - BUBBLE_GAP_PX - bubbleHeight >= VIEWPORT_PADDING_PX;
    const wouldOverflowBelow =
      rect.bottom + BUBBLE_GAP_PX + bubbleHeight >
      viewportHeight - VIEWPORT_PADDING_PX;
    const placement: FullTextRevealPlacement =
      wouldOverflowBelow && canFitAbove ? 'top' : 'bottom';
    const top =
      placement === 'top'
        ? Math.max(VIEWPORT_PADDING_PX, rect.top - BUBBLE_GAP_PX - bubbleHeight)
        : Math.min(
            rect.bottom + BUBBLE_GAP_PX,
            Math.max(VIEWPORT_PADDING_PX, viewportHeight - VIEWPORT_PADDING_PX)
          );
    const arrowLeft = clamp(
      anchorCenter - left,
      ARROW_EDGE_PADDING_PX,
      Math.max(ARROW_EDGE_PADDING_PX, bubbleWidth - ARROW_EDGE_PADDING_PX)
    );
    // If consumer provided width in %, compute relative to container to
    // preserve prior contract from in-flow absolute positioning.
    if (style && typeof style.width === 'string' && /%$/.test(style.width)) {
      const pct = parseFloat(style.width);
      if (!Number.isNaN(pct)) {
        setComputedWidth(`${(rect.width * pct) / 100}px`);
      }
    } else {
      setComputedWidth(undefined);
    }
    return { arrowLeft, left, placement, top };
  }, [alignment, anchorRef, direction, style]);

  useOutsideClick(outsideClickRefs, onDismiss, {
    enabled: Boolean(show && onDismiss && dismissOnOutsidePress),
    closeOnScroll: false
  });

  useLayoutEffect(() => {
    if (!show) {
      setPosition(null);
      return;
    }
    let frameId = 0;
    setPosition(computeCoords());
    frameId = window.requestAnimationFrame(() => {
      setPosition(computeCoords());
    });
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [show, computeCoords, text]);

  useEffect(() => {
    if (!show) return;
    const onResize = () => setPosition(computeCoords());
    const onScroll = () => {
      if (onDismiss && dismissOnScroll) {
        onDismiss();
        return;
      }
      setPosition(computeCoords());
    };
    addEvent(window, 'resize', onResize);
    addEvent(window, 'orientationchange', onResize);
    addEvent(window, 'scroll', onScroll, { capture: true });
    addEvent(document, 'scroll', onScroll, { capture: true });
    return () => {
      removeEvent(window, 'resize', onResize);
      removeEvent(window, 'orientationchange', onResize);
      removeEvent(window, 'scroll', onScroll, { capture: true });
      removeEvent(document, 'scroll', onScroll, { capture: true });
    };
  }, [dismissOnScroll, onDismiss, show, computeCoords]);

  useEffect(() => {
    if (!show || !onDismiss) {
      routeKeyRef.current = routeKey;
      return;
    }
    if (routeKeyRef.current && routeKeyRef.current !== routeKey) {
      onDismiss();
    }
    routeKeyRef.current = routeKey;
  }, [onDismiss, routeKey, show]);

  useEffect(() => {
    if (!show || !onDismiss || dismissTouchMoveThreshold <= 0) return;
    const dismiss = onDismiss;

    function handleTouchStart(event: Event) {
      const touch = (event as TouchEvent).touches[0];
      if (!touch) return;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    }

    function handleTouchMove(event: Event) {
      const start = touchStartRef.current;
      const touch = (event as TouchEvent).touches[0];
      if (!start || !touch) return;
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movement < dismissTouchMoveThreshold) return;
      touchStartRef.current = null;
      dismiss();
    }

    addEvent(window, 'touchstart', handleTouchStart, { capture: true });
    addEvent(window, 'touchmove', handleTouchMove, { capture: true });
    return () => {
      removeEvent(window, 'touchstart', handleTouchStart, { capture: true });
      removeEvent(window, 'touchmove', handleTouchMove, { capture: true });
    };
  }, [dismissTouchMoveThreshold, onDismiss, show]);

  const portalTarget =
    typeof document !== 'undefined'
      ? (document.getElementById('outer-layer') as HTMLElement | null) ?? null
      : null;

  const sanitizedStyle = useMemo(() => {
    if (!style) return undefined;
    const rest = { ...style };
    delete rest.position;
    delete rest.top;
    delete rest.left;
    delete rest.right;
    delete rest.bottom;
    delete rest.zIndex;
    delete rest.width;
    delete rest.maxWidth;
    delete rest.minWidth;
    delete rest.pointerEvents;
    // width handled below if percentage
    return rest as React.CSSProperties;
  }, [style]);

  return (
    <ErrorBoundary
      componentPath="FullTextReveal"
      innerRef={containerRef}
      style={{ position: 'relative' }}
    >
      {show && portalTarget && position
        ? createPortal(
            <div
              ref={bubbleRef}
              translate="no"
              data-placement={position.placement}
              className={`${bubbleClass} ${className || ''}`}
              style={{
                top: position.top,
                left: position.left,
                maxWidth: constrainedMaxWidth,
                minWidth: constrainedMinWidth,
                pointerEvents: onDismiss ? 'auto' : style?.pointerEvents || 'none',
                '--full-text-reveal-arrow-left': `${position.arrowLeft}px`,
                width:
                  computedWidth ??
                  (style?.width as string | number | undefined),
                ...sanitizedStyle
              } as React.CSSProperties}
            >
              {text}
            </div>,
            portalTarget
          )
        : null}
    </ErrorBoundary>
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function formatCssSize(value: string | number | undefined) {
  if (typeof value === 'number') return `${value}px`;
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getConstrainedCssSize({
  value,
  fallback,
  viewportMaxWidth
}: {
  value?: string | number;
  fallback: string;
  viewportMaxWidth: string;
}) {
  const formattedValue = formatCssSize(value);
  if (!formattedValue) return fallback;
  return `min(${formattedValue}, ${viewportMaxWidth})`;
}
