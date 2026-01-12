import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';

const DEFAULT_WHEEL_SIZE = 280;
const DEFAULT_SPIN_DURATION = 3200;
const MIN_SPIN_DURATION = 1500;
const MAX_SPIN_DURATION = 4200;
const INITIAL_FAST_SPINS = 15;

export interface RouletteSegment {
  key: string;
  label: string;
  weight: number;
  gradient: readonly [string, string];
}

export interface RouletteOutcome<TData = unknown> {
  outcomeKey: string;
  message?: string;
  data?: TData;
}

export type RouletteResolveResult<TData = unknown> =
  | {
      type: 'outcome';
      outcome: RouletteOutcome<TData>;
    }
  | {
      type: 'cancel';
    };

interface RouletteProps<TData = unknown> {
  segments: RouletteSegment[];
  spinButtonDisabled?: boolean;
  spinButtonLabel?: React.ReactNode;
  spinButtonDisabledLabel?: React.ReactNode;
  costLabel?: React.ReactNode;
  onResolveOutcome: () => Promise<RouletteResolveResult<TData>>;
  onOutcomeResolved?: (outcome: RouletteOutcome<TData>) => void;
  onSpinComplete?: (outcome: RouletteOutcome<TData>) => void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
  wheelSize?: number;
}

export default function Roulette<TData = unknown>(props: RouletteProps<TData>) {
  return (
    <ErrorBoundary componentPath="components/Roulette">
      <RouletteInner {...props} />
    </ErrorBoundary>
  );
}

function RouletteInner<TData = unknown>({
  segments,
  spinButtonDisabled = false,
  spinButtonLabel = 'Spin',
  spinButtonDisabledLabel,
  costLabel,
  onResolveOutcome,
  onOutcomeResolved,
  onSpinComplete,
  onCancel,
  onError,
  wheelSize = DEFAULT_WHEEL_SIZE
}: RouletteProps<TData>) {
  const wheelRadius = wheelSize / 2;

  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [hasSpun, setHasSpun] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const labelContainerRef = useRef<HTMLDivElement>(null);
  const currentAngleRef = useRef(0);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const spinDurationRef = useRef(DEFAULT_SPIN_DURATION);
  const overlayOpacityRef = useRef(0);
  const isSpinningRef = useRef(false);
  const resolvedOutcomeRef = useRef<RouletteOutcome<TData> | null>(null);

  const normalizedSegments = useMemo(() => {
    const totalWeight = segments.reduce(
      (sum, segment) => sum + Math.max(0, segment.weight),
      0
    );
    if (!totalWeight) return [];
    return segments.map((segment) => ({
      ...segment,
      size: (Math.max(0, segment.weight) / totalWeight) * 360
    }));
  }, [segments]);

  const wheelGradient = useMemo(() => {
    let angleStart = 0;
    return normalizedSegments
      .map((segment) => {
        const startAngle = angleStart;
        const endAngle = angleStart + segment.size;
        angleStart = endAngle;
        return `${segment.gradient[0]} ${startAngle}deg, ${segment.gradient[1]} ${endAngle}deg`;
      })
      .join(', ');
  }, [normalizedSegments]);

  const wheelContainerStyles = useMemo(
    () => css`
      position: relative;
      width: ${wheelSize}px;
      height: ${wheelSize}px;
      border-radius: 50%;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
      background: #fff;
      padding: 3px;
      text-align: center;

      @media (max-width: ${mobileMaxWidth}) {
        transform: scale(0.7);
        transform-origin: center center;
      }
    `,
    [wheelSize]
  );

  const wheelStyles = useMemo(
    () => css`
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: conic-gradient(${wheelGradient});
      position: relative;
      will-change: transform, filter;
      --roulette-white-overlay: 0;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, var(--roulette-white-overlay));
        transition: background 0.3s ease;
        z-index: 3;
      }
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.3) 0%,
          rgba(255, 255, 255, 0) 70%
        );
      }
    `,
    [wheelGradient]
  );

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          gap: 1rem;
        }
      `}
    >
      <div className={wheelContainerStyles}>
        <div className={pointerStyles} />
        <div ref={wheelRef} className={wheelStyles}>
          <div ref={labelContainerRef} className={labelContainerStyles}>
            {normalizedSegments.map((segment, index) => {
              let startAngle = 0;
              for (let i = 0; i < index; i++) {
                startAngle += normalizedSegments[i].size;
              }
              const labelAngle = startAngle + segment.size / 2;
              const radius = wheelRadius * 0.7;

              return (
                <div
                  key={segment.key}
                  className={segmentLabelStyles}
                  style={{
                    transform: `
                      translate(
                        ${
                          Math.cos(((labelAngle - 90) * Math.PI) / 180) * radius
                        }px,
                        ${
                          Math.sin(((labelAngle - 90) * Math.PI) / 180) * radius
                        }px
                      )
                      translate(-50%, -50%)
                      rotate(${labelAngle}deg)
                    `
                  }}
                >
                  {segment.label}
                </div>
              );
            })}
          </div>
        </div>
        <div className={wheelCenterStyles} />
      </div>

      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        {!hasSpun && (
          <>
            <button
              className={spinButtonStyles}
              onClick={handleSpin}
              disabled={spinButtonDisabled}
            >
              {spinButtonDisabled
                ? (spinButtonDisabledLabel ?? spinButtonLabel)
                : spinButtonLabel}
            </button>
            {costLabel}
          </>
        )}
        <div className={resultTextStyles}>
          {resultMessage && (
            <div className={resultMessageStyles}>{resultMessage}</div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleSpin() {
    if (spinButtonDisabled || hasSpun || isSpinningRef.current) return;
    if (!normalizedSegments.length) return;

    isSpinningRef.current = true;
    resolvedOutcomeRef.current = null;
    startTransition(() => {
      setHasSpun(true);
      setResultMessage(null);
    });

    resetVisualState();

    let spinAngle = 0;
    const warmupStartTime = Date.now();
    const MAX_ROTATION_SPEED = 720;

    function warmUpSpin() {
      const elapsedTime = Date.now() - warmupStartTime;
      const speed = Math.min((elapsedTime / 20) * 20, MAX_ROTATION_SPEED);

      spinAngle += speed * (20 / 1000);
      currentAngleRef.current = spinAngle;

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${spinAngle}deg)`;
        wheelRef.current.style.filter = 'blur(0px)';
      }
      if (labelContainerRef.current) {
        labelContainerRef.current.style.opacity = '0';
      }

      animationRef.current = requestAnimationFrame(warmUpSpin);
    }

    animationRef.current = requestAnimationFrame(warmUpSpin);

    let resolved: RouletteResolveResult<TData>;
    try {
      resolved = await onResolveOutcome();
    } catch (error: unknown) {
      resetSpinState();
      onError?.(error);
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    if (resolved.type === 'cancel') {
      resetSpinState();
      onCancel?.();
      return;
    }

    resolvedOutcomeRef.current = resolved.outcome;
    onOutcomeResolved?.(resolved.outcome);

    const warmupElapsed = Date.now() - warmupStartTime;
    const targetTotal = DEFAULT_SPIN_DURATION;
    const adjustedDuration = Math.max(
      MIN_SPIN_DURATION,
      Math.min(MAX_SPIN_DURATION, targetTotal - warmupElapsed)
    );
    spinDurationRef.current = adjustedDuration;

    const angleForOutcome = getTargetAngleForOutcome(
      resolved.outcome.outcomeKey
    );
    targetAngleRef.current =
      angleForOutcome + Math.floor(spinAngle / 360) * 360;
    startTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
  }

  function animate(timestamp: number) {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;
    const spinDuration = spinDurationRef.current || DEFAULT_SPIN_DURATION;
    const progress = Math.min(elapsed / spinDuration, 1);

    function customEaseOut(t: number) {
      const fastPhase = Math.pow(1 - t, 2);
      const slowPhase = Math.pow(1 - t, 3);
      return 1 - (fastPhase * 0.7 + slowPhase * 0.3);
    }

    const easedProgress = customEaseOut(progress);

    const newOpacity = progress < 0.7 ? 0 : (progress - 0.7) / 0.3;
    if (labelContainerRef.current) {
      labelContainerRef.current.style.opacity = String(newOpacity);
    }

    const blurAmount = progress < 0.6 ? 3 : (0.8 - progress) * 7.5;
    const finalBlur = Math.max(0, blurAmount);

    const totalSpins = INITIAL_FAST_SPINS + 2;
    const newAngle =
      (360 * totalSpins + targetAngleRef.current) * easedProgress;
    currentAngleRef.current = newAngle;

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${newAngle}deg)`;
      wheelRef.current.style.filter = `blur(${finalBlur}px)`;
    }

    // Update overlay via CSS variable to avoid per-frame React renders
    const overlayOpacity =
      progress < 0.37 ? 0.8 : progress < 0.5 ? (0.5 - progress) * 6 : 0;
    if (Math.abs(overlayOpacity - overlayOpacityRef.current) > 0.05) {
      overlayOpacityRef.current = overlayOpacity;
      wheelRef.current?.style.setProperty(
        '--roulette-white-overlay',
        String(overlayOpacity)
      );
    }

    if (progress >= 1) {
      isSpinningRef.current = false;
      overlayOpacityRef.current = 0;
      wheelRef.current?.style.setProperty('--roulette-white-overlay', '0');
      if (labelContainerRef.current) {
        labelContainerRef.current.style.opacity = '1';
      }

      const outcome = resolvedOutcomeRef.current;
      startTransition(() => {
        setResultMessage(outcome?.message || '');
        if (outcome) {
          onSpinComplete?.(outcome);
        }
      });
      return;
    }
    animationRef.current = requestAnimationFrame(animate);
  }

  function getTargetAngleForOutcome(outcomeKey: string) {
    const index = normalizedSegments.findIndex((s) => s.key === outcomeKey);
    if (index === -1) return 0;

    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += normalizedSegments[i].size;
    }

    const randomFactor = 0.2 + Math.random() * 0.6;
    return -(startAngle + normalizedSegments[index].size * randomFactor);
  }

  function resetVisualState() {
    currentAngleRef.current = 0;
    overlayOpacityRef.current = 0;
    wheelRef.current?.style.setProperty('--roulette-white-overlay', '0');
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'rotate(0deg)';
      wheelRef.current.style.filter = 'blur(0px)';
    }
    if (labelContainerRef.current) {
      labelContainerRef.current.style.opacity = '1';
    }
    startTimeRef.current = 0;
    spinDurationRef.current = DEFAULT_SPIN_DURATION;
  }

  function resetSpinState() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    resolvedOutcomeRef.current = null;
    isSpinningRef.current = false;
    resetVisualState();
    startTransition(() => {
      setResultMessage(null);
      setHasSpun(false);
    });
  }
}

const pointerStyles = css`
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
  z-index: 10;
`;

const wheelCenterStyles = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  z-index: 5;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
  }
`;

const labelContainerStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  opacity: 1;
  transition: opacity 0.3s ease;
`;

const segmentLabelStyles = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  text-align: center;
  pointer-events: none;
  white-space: pre-wrap;
`;

const resultTextStyles = css`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  color: #2d3748;
  min-height: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const resultMessageStyles = css`
  opacity: 0;
  transform: translateY(10px);
  animation: fadeIn 0.5s ease forwards;
  animation-delay: 0.5s;

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const spinButtonStyles = css`
  margin-top: 1rem;
  padding: 1.5rem 3rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  background: linear-gradient(45deg, #ffd700, #ff69b4, #9370db, #4169e1);
  background-size: 300% 300%;
  animation: gradient 5s ease infinite;
  transition: all 0.3s ease;

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    background: #808080;
    transform: none;
    animation: none;
  }

  &:not(:disabled) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 7px 14px rgba(0, 0, 0, 0.2);
    }
  }
`;
