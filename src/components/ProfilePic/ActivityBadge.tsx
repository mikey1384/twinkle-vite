import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import type { UserActivity } from '~/helpers/userActivity';

export default function ActivityBadge({
  activity
}: {
  activity: UserActivity;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const onSetChessPuzzleModalShown = useHomeContext(
    (v) => v.actions.onSetChessPuzzleModalShown
  );
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const focusOnOpen = useRef(false);
  const [shown, setShown] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const [imageFailed, setImageFailed] = useState(false);
  const verb = activity.kind === 'game' ? 'Playing' : 'Using';
  const label = `${verb} ${activity.title}`;
  const chatGame =
    activity.kind === 'game' &&
    (activity.id === 'chess' || activity.id === 'omok');
  const fallback =
    activity.kind === 'app'
      ? '▦'
      : {
          wordle: 'W',
          grammarbles: 'G',
          chess: '♟',
          'chess-puzzles': '♟',
          omok: '●'
        }[activity.id];

  useEffect(() => {
    setImageFailed(false);
  }, [activity.thumbnailUrl]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useLayoutEffect(() => {
    if (!shown) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0;
      const top = viewport?.offsetTop || 0;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const popupWidth = Math.min(270, width - 24);
      const popupHeight =
        popupRef.current?.getBoundingClientRect().height || 126;
      setPosition({
        width: popupWidth,
        left: Math.max(
          left + 12,
          Math.min(rect.left, left + width - popupWidth - 12)
        ),
        top: Math.max(
          top + 12,
          Math.min(
            rect.bottom + popupHeight + 8 < top + height
              ? rect.bottom + 8
              : rect.top - popupHeight - 8,
            top + height - popupHeight - 12
          )
        )
      });
    }
    function outside(event: Event) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popupRef.current?.contains(target)
      )
        setShown(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setShown(false);
      triggerRef.current?.focus({ preventScroll: true });
    }
    place();
    if (focusOnOpen.current) {
      actionRef.current?.focus({ preventScroll: true });
      focusOnOpen.current = false;
    }
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
    };
  }, [shown, activity.title]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={badgeClass}
        data-game={activity.kind === 'game' ? activity.id : undefined}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={shown}
        aria-controls={shown ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') show();
        }}
        onPointerLeave={scheduleClose}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          focusOnOpen.current = !shown;
          show();
          if (shown) actionRef.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {activity.thumbnailUrl && !imageFailed ? (
          <img
            src={activity.thumbnailUrl}
            alt=""
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden>{fallback}</span>
        )}
      </button>
      {shown
        ? createPortal(
            <div
              ref={popupRef}
              id={id}
              role="dialog"
              aria-label={label}
              className={popupClass}
              style={position}
              onPointerEnter={show}
              onPointerLeave={scheduleClose}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onBlur={(event) => {
                if (
                  event.relatedTarget &&
                  !event.currentTarget.contains(event.relatedTarget) &&
                  event.relatedTarget !== triggerRef.current
                )
                  setShown(false);
              }}
            >
              <div className="activity-heading">
                <span
                  className="activity-icon"
                  data-game={activity.kind === 'game' ? activity.id : undefined}
                >
                  {activity.thumbnailUrl && !imageFailed ? (
                    <img
                      src={activity.thumbnailUrl}
                      alt=""
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    fallback
                  )}
                </span>
                <div>
                  <span className="activity-verb">{verb}</span>
                  <strong>{activity.title}</strong>
                </div>
                <button
                  type="button"
                  className="activity-close"
                  aria-label="Close activity"
                  onClick={() => {
                    setShown(false);
                    triggerRef.current?.focus({ preventScroll: true });
                  }}
                >
                  ×
                </button>
              </div>
              <button
                ref={actionRef}
                type="button"
                className="activity-open"
                onClick={openActivity}
              >
                {activity.kind === 'app'
                  ? 'Open app'
                  : chatGame
                    ? 'Open chat'
                    : `Play ${activity.title}`}
              </button>
            </div>,
            document.getElementById('outer-layer') || document.body
          )
        : null}
    </>
  );

  function show() {
    clearTimeout(closeTimer.current);
    setShown(true);
  }
  function scheduleClose() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (!popupRef.current?.contains(document.activeElement)) setShown(false);
    }, 220);
  }
  function openActivity() {
    setShown(false);
    if (activity.kind === 'app') {
      navigate(`/app/${activity.id}`);
      return;
    }
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    if (activity.id === 'grammarbles') {
      onSetGrammarGameModalShown(true);
      navigate('/');
    } else if (activity.id === 'chess-puzzles')
      onSetChessPuzzleModalShown(true);
    else {
      onUpdateSelectedChannelId(GENERAL_CHAT_ID);
      if (activity.id === 'wordle') onSetWordleModalShown(true);
      navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
    }
  }
}

const badgeClass = css`
  position: absolute;
  /* Center on the circular portrait's lower-left edge at every avatar size. */
  left: 14.65%;
  bottom: 14.65%;
  transform: translate(-50%, 50%);
  z-index: 2;
  width: clamp(1.4rem, 36%, 2.8rem);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 35%;
  background: #e9f0fc;
  color: #355987;
  box-shadow: 0 1px 4px #17243d30;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  &::after {
    content: '';
    position: absolute;
    inset: -4px;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
  &[data-game='wordle'] {
    background: #538d4e;
    color: #fff;
  }
  &[data-game='grammarbles'] {
    background: #df4795;
    color: #fff;
  }
  &[data-game='chess'],
  &[data-game='chess-puzzles'] {
    background: #37465b;
    color: #fff;
  }
  &[data-game='omok'] {
    background: #e4bc7c;
    color: #2d3541;
  }
  &:focus-visible {
    outline: 2px solid #3876d3;
    outline-offset: 2px;
  }
`;

const popupClass = css`
  position: fixed;
  z-index: 100000001;
  padding: 1.2rem;
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #fff;
  color: #29374a;
  box-shadow: 0 8px 28px #1b305530;
  .activity-heading {
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }
  .activity-icon {
    width: 3.6rem;
    height: 3.6rem;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #edf2fa;
    color: #476793;
    font-size: 2rem;
    font-weight: 700;
    overflow: hidden;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .activity-heading > div {
    min-width: 0;
  }
  .activity-verb {
    display: block;
    font-size: 1.1rem;
    color: #6e7c8e;
    margin-bottom: 0.2rem;
  }
  strong {
    display: block;
    font-size: 1.3rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .activity-close {
    align-self: flex-start;
    flex-shrink: 0;
    margin-left: auto;
    width: 2.4rem;
    height: 2.4rem;
    border: 0;
    background: transparent;
    color: #728195;
    font-size: 2rem;
    cursor: pointer;
  }
  .activity-open {
    display: block;
    width: 100%;
    margin-top: 1rem;
    padding: 0.8rem;
    border: 1px solid #cadbf5;
    border-radius: 7px;
    background: #eef5ff;
    color: #2b63b3;
    font-size: 1.2rem;
    font-weight: 650;
    cursor: pointer;
  }
  .activity-open:hover {
    background: #e0edff;
  }
  button:focus-visible {
    outline: 2px solid #3876d3;
    outline-offset: 2px;
  }
`;
