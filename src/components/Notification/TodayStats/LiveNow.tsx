import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ProfilePic from '~/components/ProfilePic';
import useUserPopupTrigger from '~/components/UserPopup/useUserPopupTrigger';
import { useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import { PRESENCE_HIDDEN_USER_IDS } from '~/helpers/hiddenPresence';
import { trackEvent } from '~/helpers/analytics';
import useBlockedUsers from '~/helpers/hooks/useBlockedUsers';
import { abbreviateNumber, addCommasToNumber } from '~/helpers/stringHelpers';
import { useWalkUp } from '~/helpers/hooks/useSocialWalkups';
import {
  bestJoinAction,
  JOIN_VERB_LABELS,
  joinableBadge
} from '~/helpers/socialWalkups';
import type { User } from '~/types';
import {
  createLiveNowShownTracker,
  createLiveNowSignatureReader,
  LIVE_NOW_COLLAPSED_APPS,
  type LiveNowApp,
  type LiveNowMember
} from '~/helpers/liveNow';

const panelCls = css`
  margin: 0.8rem auto 0;
  max-width: 40rem;
  padding: 0.6rem 0.8rem 0.6rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.98);
  /* One-shot entrance; transform and opacity only. */
  animation: liveNowIn 0.28s ease-out;
  @keyframes liveNowIn {
    from {
      opacity: 0;
      transform: translateY(-0.4rem);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const headingCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.2rem 0.4rem;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--live-now-accent);
  .live-dot {
    position: relative;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: #2fbf71;
  }
  .live-dot::after {
    /* Looping pulse: transform + opacity only (looping-animation rule). */
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #2fbf71;
    animation: liveNowPulse 2.4s ease-out infinite;
  }
  @keyframes liveNowPulse {
    0% {
      transform: scale(1);
      opacity: 0.55;
    }
    70%,
    100% {
      transform: scale(2.4);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .live-dot::after {
      animation: none;
      opacity: 0;
    }
  }
`;

const listCls = css`
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const entryCls = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  /* At least 42px tall: the whole row is the tap target. */
  min-height: 4.2rem;
  padding: 0.3rem 0.4rem;
  border-radius: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  &:hover {
    background: var(--live-now-hover);
  }
  .live-thumb {
    flex: 0 0 auto;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 0.8rem;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: #e9f0fc;
    color: #355987;
    font-weight: 800;
    font-size: 1.6rem;
  }
  .live-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .live-main {
    /* Narrow cards: title on its own line, then the tag and the faces
       (wrapping if needed). Wide cards: see the container query below. */
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.5rem;
    row-gap: 0.15rem;
  }
  .live-title {
    flex: 1 0 100%;
    min-width: 0;
    font-size: 1.4rem;
    line-height: 1.3;
    font-weight: 700;
    color: var(--live-now-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-tag {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
    padding: 0 0.6rem;
    border-radius: 999px;
    color: #1f7a4c;
    background: rgba(47, 191, 113, 0.14);
  }
  .live-people {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .live-faces {
    display: flex;
    align-items: center;
  }
  .live-face {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #fff;
    background: #fff;
  }
  .live-face + .live-face {
    margin-left: -0.8rem;
  }
  /* Someone you can join: a small dot on their face (green = ready now,
     amber = busy, you can be next). */
  .live-face {
    position: relative;
  }
  .live-face[data-joinable]::after {
    content: '';
    position: absolute;
    right: -0.1rem;
    bottom: -0.1rem;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    background: #2fbf71;
    box-shadow: 0 0 0 2px #fff;
  }
  .live-face[data-joinable='busy-watchable']::after,
  .live-face[data-joinable='busy']::after {
    background: #e8a33d;
  }
  /* What each joinable person is up to, in the app's own words. One line
     per person; tapping it opens them (Play / Watch). */
  .live-joins {
    flex: 1 0 100%;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.5rem;
    margin-top: 0.1rem;
  }
  .live-join {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
    min-height: 2.8rem;
    padding: 0.2rem 0.9rem 0.2rem 0.7rem;
    border: 0;
    border-radius: 999px;
    background: rgba(47, 191, 113, 0.12);
    color: #1f6a44;
    font: inherit;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .live-join:hover {
    background: rgba(47, 191, 113, 0.2);
  }
  .live-join[data-state='busy-watchable'],
  .live-join[data-state='busy'] {
    background: rgba(232, 163, 61, 0.14);
    color: #7a5312;
  }
  .live-join[data-state='busy-watchable']:hover,
  .live-join[data-state='busy']:hover {
    background: rgba(232, 163, 61, 0.24);
  }
  .live-join-dot {
    flex: 0 0 auto;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: currentColor;
  }
  .live-join-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-count {
    min-width: 1.2rem;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--live-now-muted);
    font-variant-numeric: tabular-nums;
  }
  @container today-card (max-width: 25.9rem) {
    /* The narrowest cards (320px phones): smaller art and a slimmer Join. */
    gap: 0.6rem;
    padding: 0.3rem 0.2rem;
    .live-thumb {
      width: 2.8rem;
      height: 2.8rem;
    }
    .live-title {
      font-size: 1.3rem;
    }
    .live-face {
      width: 2.2rem;
      height: 2.2rem;
    }
    > button {
      padding-left: 0.7rem;
      padding-right: 0.7rem;
    }
  }
  @container today-card (max-width: 20.9rem) {
    /* Tablet side panels (20rem): Join moves under the title and faces. */
    flex-wrap: wrap;
    row-gap: 0.3rem;
    .live-main {
      flex-basis: calc(100% - 3.4rem);
    }
    > button {
      margin-left: auto;
    }
  }
  @container today-card (min-width: 32rem) {
    /* Wide cards: title and tag on the left, faces and count on the right. */
    .live-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 0.8rem;
      row-gap: 0.15rem;
    }
    .live-title {
      grid-column: 1;
      grid-row: 1;
    }
    .live-tag {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
    }
    .live-people {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
    .live-joins {
      grid-column: 1 / -1;
      grid-row: 3;
    }
  }
`;

const moreCls = css`
  display: block;
  margin: 0.1rem auto 0;
  padding: 0.3rem 1rem;
  border: 0;
  background: none;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--live-now-accent);
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

// At most this many "who you can join" lines per app.
const LIVE_NOW_JOIN_LINES = 2;

// Today's Progress reads this too: while anything is live the card compacts
// its header so the whole card keeps about the same height.
const readLiveNowSignature = createLiveNowSignatureReader({
  hiddenUserIds: PRESENCE_HIDDEN_USER_IDS
});
export function useLiveNowApps(myId: number) {
  // Members the viewer blocked never show as a face or in a count.
  const blockedUserIds = useBlockedUsers().blockedIds;
  // A string signature keeps the card from re-rendering on presence changes
  // that do not change who is in which app (heartbeats, away flips elsewhere),
  // and the reader skips all work while chatStatus itself is unchanged.
  const signature = useChatContext((v) =>
    readLiveNowSignature(v.state.chatStatus, myId, blockedUserIds)
  );
  return useMemo<LiveNowApp[]>(() => JSON.parse(signature), [signature]);
}

// Live now coming, going or reordering changes the card's height. While the
// pointer is over the card (mouse) or a finger touched it in the last
// LIVE_NOW_TOUCH_HOLD_MS, the card keeps showing what it showed, so nothing
// moves under the pointer; the update lands once the pointer leaves or rests.
export const LIVE_NOW_TOUCH_HOLD_MS = 2500;
export function useHeldWhileInteracting<T>(value: T, externalHold = false) {
  const [displayed, setDisplayed] = useState(value);
  const [hovering, setHovering] = useState(false);
  const [touching, setTouching] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const held = hovering || touching || externalHold;
  useEffect(() => {
    if (!held) setDisplayed(value);
  }, [held, value]);
  useEffect(() => () => clearTimeout(touchTimer.current), []);
  function holdForTouch() {
    setTouching(true);
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(
      () => setTouching(false),
      LIVE_NOW_TOUCH_HOLD_MS
    );
  }
  return {
    displayed: held ? displayed : value,
    handlers: {
      onPointerEnter: (event: React.PointerEvent) => {
        if (event.pointerType === 'mouse') setHovering(true);
      },
      onPointerLeave: (event: React.PointerEvent) => {
        if (event.pointerType === 'mouse') setHovering(false);
      },
      onPointerDown: (event: React.PointerEvent) => {
        if (event.pointerType !== 'mouse') holdForTouch();
      },
      onPointerUp: (event: React.PointerEvent) => {
        if (event.pointerType !== 'mouse') holdForTouch();
      }
    }
  };
}

// "Live now shown" telemetry: the first time in this tab, then at most every
// 10 minutes, shared by every Today's Progress mount (home, mobile menu...).
const shouldTrackLiveNowShown = createLiveNowShownTracker();

export default function LiveNow({
  apps,
  accentColor,
  buttonColor,
  onPopupOpenChange
}: {
  apps: LiveNowApp[];
  accentColor: string;
  buttonColor: string;
  // Lets Today's Progress hold the list while a face's profile popup is open.
  onPopupOpenChange?: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const walkUp = useWalkUp();
  const [expanded, setExpanded] = useState(false);
  // Which faces / join lines have their profile card open right now.
  const [openPopupKeys, setOpenPopupKeys] = useState<string[]>([]);
  const handlePopupShown = useCallback((key: string, shown: boolean) => {
    setOpenPopupKeys((keys) => {
      if (shown) return keys.includes(key) ? keys : [...keys, key];
      return keys.includes(key) ? keys.filter((k) => k !== key) : keys;
    });
  }, []);

  // Count an impression only when the row is actually on screen: Home also
  // mounts a hidden copy of this card (its right column is display: none on
  // phones), which must neither report nor use up the tab's next impression.
  const sectionRef = useRef<HTMLElement | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(!!entry?.isIntersecting)
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!onScreen || !shouldTrackLiveNowShown(apps)) return;
    trackEvent('live_now_shown', {
      apps: apps.length,
      people: apps.reduce((sum, app) => sum + app.count, 0),
      multiplayer_apps: apps.filter((app) => app.multiplayer).length
    });
  }, [apps, onScreen]);

  useEffect(() => {
    if (apps.length <= LIVE_NOW_COLLAPSED_APPS) setExpanded(false);
  }, [apps.length]);

  const popupOpen = openPopupKeys.length > 0;
  useEffect(() => {
    onPopupOpenChange?.(popupOpen);
  }, [onPopupOpenChange, popupOpen]);
  useEffect(() => () => onPopupOpenChange?.(false), [onPopupOpenChange]);

  if (!apps.length) return null;

  const visible = expanded ? apps : apps.slice(0, LIVE_NOW_COLLAPSED_APPS);
  const hiddenCount = apps.length - LIVE_NOW_COLLAPSED_APPS;

  return (
    <section
      ref={sectionRef}
      className={panelCls}
      aria-label="Live now"
      style={
        {
          '--live-now-accent': accentColor,
          '--live-now-text': Color.darkerGray(),
          '--live-now-muted': Color.gray(),
          '--live-now-hover': 'rgba(65, 140, 235, 0.07)'
        } as React.CSSProperties
      }
    >
      <div className={headingCls}>
        <span className="live-dot" aria-hidden />
        <span>Live now</span>
      </div>
      <ul className={listCls}>
        {visible.map((app, index) => (
          <li
            key={app.appId}
            className={entryCls}
            onClick={() => join(app, index, 'app')}
          >
            <span className="live-thumb" aria-hidden>
              <AppThumb app={app} />
            </span>
            <span className="live-main">
              <span className="live-title">{app.title}</span>
              {app.multiplayer ? (
                <span className="live-tag">Multiplayer</span>
              ) : null}
              <span
                className="live-people"
                aria-label={`${app.count} ${app.count === 1 ? 'person' : 'people'} in ${app.title}`}
              >
                <span className="live-faces">
                  {app.members.map((member) => (
                    <LiveNowFace
                      key={member.id}
                      member={member}
                      app={app}
                      onPopupShown={handlePopupShown}
                    />
                  ))}
                </span>
                <span
                  className="live-count"
                  title={
                    app.count >= 1000 ? addCommasToNumber(app.count) : undefined
                  }
                >
                  {app.count >= 1000 ? abbreviateNumber(app.count) : app.count}
                </span>
              </span>
              {app.joinable > 0 ? (
                <span className="live-joins">
                  {app.members
                    .filter((member) => member.joinable)
                    .slice(0, LIVE_NOW_JOIN_LINES)
                    .map((member) => (
                      <LiveNowJoinLine
                        key={member.id}
                        member={member}
                        app={app}
                        onPopupShown={handlePopupShown}
                      />
                    ))}
                </span>
              ) : null}
            </span>
            <LiveNowRowButton
              app={app}
              buttonColor={buttonColor}
              onJoin={() => join(app, index, 'join')}
            />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className={moreCls}
          aria-expanded={expanded}
          onClick={() => {
            if (!expanded) trackEvent('live_now_tap', { target: 'more' });
            setExpanded((value) => !value);
          }}
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      ) : null}
    </section>
  );

  function join(app: LiveNowApp, index: number, target: 'app' | 'join') {
    // The row's button says what this does (bestJoinAction): Join an open
    // room, Play with someone ready for a game, or Watch. Tapping the row
    // itself does the same; with nothing to join it opens the app, as always
    // (nobody busy is queued on without the member choosing them).
    const action = bestJoinAction(app.members);
    trackEvent('live_now_tap', { target, app_id: app.appId });
    trackEvent('live_now_join', {
      app_id: app.appId,
      people: app.count,
      multiplayer: app.multiplayer,
      position: index + 1,
      action: action?.verb || 'open'
    });
    if (action) {
      void walkUp({
        buildId: app.appId,
        host: action.member,
        intent: action.intent,
        source: 'live_now'
      });
      return;
    }
    navigate(`/app/${app.appId}`);
  }
}

// The row's one button, worded by what tapping it does: Join (an open room),
// Play (someone ready for a game) or Watch. Nothing when there is nothing to
// join; the row itself still opens the app.
function LiveNowRowButton({
  app,
  buttonColor,
  onJoin
}: {
  app: LiveNowApp;
  buttonColor: string;
  onJoin: () => void;
}) {
  const action = bestJoinAction(app.members);
  if (!action) return null;
  const label = JOIN_VERB_LABELS[action.verb];
  return (
    <Button
      color={buttonColor}
      variant="soft"
      tone="raised"
      size="sm"
      uppercase={false}
      aria-label={`${label}: ${app.title}`}
      onClick={(event: React.MouseEvent) => {
        event?.stopPropagation?.();
        onJoin();
      }}
    >
      {label}
    </Button>
  );
}

// A member's face or join line opens the site's standard profile card, the same
// as their name anywhere else: hover on desktop, tap on phones. Tapping it
// never walks up; the card's own Play / Watch does.
function useLiveNowMemberPopup<T extends HTMLElement>({
  member,
  app,
  popupKey,
  onPopupShown
}: {
  member: LiveNowMember;
  app: LiveNowApp;
  popupKey: string;
  onPopupShown: (key: string, shown: boolean) => void;
}) {
  const trigger = useUserPopupTrigger<T>({ user: member as unknown as User });
  const { shown } = trigger;
  useEffect(() => {
    onPopupShown(popupKey, shown);
  }, [onPopupShown, popupKey, shown]);
  useEffect(
    () => () => onPopupShown(popupKey, false),
    [onPopupShown, popupKey]
  );
  return {
    ...trigger,
    onClick(event: React.MouseEvent<HTMLElement>) {
      if (!shown) {
        trackEvent('live_now_tap', { target: 'avatar', app_id: app.appId });
      }
      void trigger.onClick(event);
    }
  };
}

function LiveNowFace({
  member,
  app,
  onPopupShown
}: {
  member: LiveNowMember;
  app: LiveNowApp;
  onPopupShown: (key: string, shown: boolean) => void;
}) {
  const { triggerRef, popup, onMouseEnter, onMouseLeave, onClick } =
    useLiveNowMemberPopup<HTMLSpanElement>({
      member,
      app,
      popupKey: `face:${app.appId}:${member.id}`,
      onPopupShown
    });
  return (
    <span
      ref={triggerRef}
      className="live-face"
      data-joinable={member.joinable?.state}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <ProfilePic
        userId={member.id}
        profilePicUrl={member.profilePicUrl}
        activityBadgeShown={false}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer'
        }}
      />
      {popup}
    </span>
  );
}

function LiveNowJoinLine({
  member,
  app,
  onPopupShown
}: {
  member: LiveNowMember;
  app: LiveNowApp;
  onPopupShown: (key: string, shown: boolean) => void;
}) {
  const { triggerRef, popup, onMouseEnter, onMouseLeave, onClick } =
    useLiveNowMemberPopup<HTMLButtonElement>({
      member,
      app,
      popupKey: `line:${app.appId}:${member.id}`,
      onPopupShown
    });
  return (
    <button
      ref={triggerRef}
      type="button"
      className="live-join"
      data-state={member.joinable!.state}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <span className="live-join-dot" aria-hidden />
      <span className="live-join-text">
        {member.username} · {joinableBadge(member.joinable!)}
      </span>
      {popup}
    </button>
  );
}

function AppThumb({ app }: { app: LiveNowApp }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [app.thumbnailUrl]);
  return app.thumbnailUrl && !failed ? (
    <img
      src={app.thumbnailUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <>▦</>
  );
}
