import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import useUserPopupTrigger from '~/components/UserPopup/useUserPopupTrigger';
import { useAppContext, useKeyContext } from '~/contexts';
import type { User } from '~/types';
import {
  useOwnJoinable,
  useSocialBuildState
} from '~/helpers/hooks/useSocialWalkups';
import {
  arrivalText,
  queueChipText,
  socialWalkupStore,
  visitLine,
  visitorBannerText,
  type SocialPerson,
  type SocialVisit,
  type WaitingVisitor
} from '~/helpers/socialWalkups';

// Drawn by Twinkle over the app, so every app gets the same walk-up manners
// (projects/arcade-walkup/SPEC.md "Experience"):
// - for the member being joined: a small edge banner ("mikey walked up ·
//   next game?") that never blocks the app and fades by itself, and a queue
//   chip while people wait. Ignoring is a soft no; nothing is ever "declined".
// - for the member who walked up: one line saying where things stand
//   ("You're next", "KenGo's still in a game...", "KenGo isn't here right now").
// - for the member whose open room someone dropped into from Live now: a
//   tiny passing toast ("mikey joined from Live now") that takes no taps.
//   They are already in; the app's own "joined" is the real news.
// The app decides when anything starts (Twinkle.social.accept).
export const SOCIAL_BANNER_MS = 12_000;
export const SOCIAL_ARRIVAL_MS = 4_000;
const VISIT_NOTE_MS = 9_000;
// A member who turned walk-ups off sees a quiet reminder for a moment when
// an app could have made them joinable, never a permanent fixture.
const OFF_CHIP_MS = 8_000;

const layerClass = css`
  position: absolute;
  z-index: 150;
  top: calc(env(safe-area-inset-top, 0px) + 10px);
  left: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  /* Only the banner, chip and note take taps; the app keeps the rest. */
  pointer-events: none;
  font-size: 15px;
  line-height: 1.3;
  color: #14233d;
  > * {
    pointer-events: auto;
  }
  button {
    font: inherit;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible {
    outline: 3px solid #f2b73a;
    outline-offset: 2px;
  }
  .social-card {
    box-sizing: border-box;
    max-width: min(360px, 100%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px 8px 10px;
    border: 1px solid #cfd9ea;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 6px 18px rgba(20, 35, 61, 0.18);
    animation: socialIn 0.24s ease-out;
  }
  @keyframes socialIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .social-card {
      animation: none;
    }
  }
  .social-face {
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
  }
  .social-line {
    flex: 1 1 auto;
    min-width: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .social-primary {
    flex: 0 0 auto;
    min-height: 40px;
    padding: 6px 14px;
    border: 0;
    border-radius: 12px;
    background: #2f8f5b;
    color: #fff;
    font-weight: 700;
    white-space: nowrap;
  }
  .social-quiet {
    flex: 0 0 auto;
    width: 36px;
    height: 40px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: #5a6a84;
    font-size: 20px;
    line-height: 1;
  }
  .social-quiet:hover {
    background: rgba(20, 35, 61, 0.07);
  }
  .social-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 4px 14px 4px 6px;
    border: 1px solid #cfd9ea;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 3px 10px rgba(20, 35, 61, 0.14);
    color: #14233d;
    font-weight: 700;
  }
  .social-chip-faces {
    display: flex;
  }
  .social-chip-faces > * {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #fff;
    background: #fff;
  }
  .social-chip-faces > * + * {
    margin-left: -9px;
  }
  .social-chip[data-quiet='true'] {
    padding: 4px 14px;
    color: #5a6a84;
    font-weight: 600;
    box-shadow: none;
  }
  .social-list {
    box-sizing: border-box;
    width: min(340px, 100%);
    padding: 10px;
    border: 1px solid #cfd9ea;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 8px 22px rgba(20, 35, 61, 0.2);
  }
  .social-list-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 2px;
  }
  .social-setting {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    margin-top: 6px;
    padding: 8px 6px 2px;
    border: 0;
    border-top: 1px solid #e3e9f3;
    background: none;
    color: #33435d;
    font-size: 15px;
    text-align: left;
  }
  .social-check {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border: 2px solid #8a98b0;
    border-radius: 6px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 15px;
    font-weight: 800;
  }
  .social-check[data-on='true'] {
    background: #2f8f5b;
    border-color: #2f8f5b;
  }
  .social-note {
    align-self: center;
  }
  .social-arrival {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: min(320px, 100%);
    min-height: 34px;
    padding: 4px 14px 4px 5px;
    border: 1px solid #cfd9ea;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 3px 10px rgba(20, 35, 61, 0.16);
    color: #14233d;
    font-size: 14px;
    font-weight: 600;
    pointer-events: none;
    animation: socialArrival ${SOCIAL_ARRIVAL_MS}ms ease-in-out forwards;
  }
  .social-arrival .social-face {
    width: 26px;
    height: 26px;
  }
  .social-arrival span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @keyframes socialArrival {
    0% {
      opacity: 0;
      transform: translateY(-6px);
    }
    8%,
    80% {
      opacity: 1;
      transform: none;
    }
    100% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .social-arrival {
      animation: none;
    }
  }
  .social-note .social-line {
    font-weight: 600;
  }
`;

export default function SocialWalkupOverlay({
  buildId,
  active
}: {
  buildId: number;
  // false while this app is kept alive in the background (another page is
  // showing): the member is not in the app as far as anyone else can tell.
  active: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const walkupsAllowed = useKeyContext(
    (v) => v.myState.settings?.social?.walkups !== false
  );
  const updateSocialSettings = useAppContext(
    (v) => v.requestHelpers.updateSocialSettings
  );
  const walkAwayFromMember = useAppContext(
    (v) => v.requestHelpers.walkAwayFromMember
  );
  const leaveSocialHost = useAppContext((v) => v.requestHelpers.leaveSocialHost);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const state = useSocialBuildState(buildId);
  const ownJoinable = useOwnJoinable(buildId);
  const [listShown, setListShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteHiddenFor, setNoteHiddenFor] = useState('');
  const visit = state.visit;
  const visitKey = visit ? `${visit.host.id}:${visit.status}` : '';
  // An ignored banner fades by itself: ignoring is a soft no. The visitor
  // stays in the queue chip.
  const bannerShownAt = state.banner?.shownAt || 0;
  useEffect(() => {
    if (!bannerShownAt) return;
    const timer = setTimeout(
      () => socialWalkupStore.dismissBanner(buildId),
      Math.max(0, bannerShownAt + SOCIAL_BANNER_MS - Date.now())
    );
    return () => clearTimeout(timer);
  }, [bannerShownAt, buildId]);
  const arrivalShownAt = state.arrival?.shownAt || 0;
  useEffect(() => {
    if (!arrivalShownAt) return;
    const timer = setTimeout(
      () => socialWalkupStore.dismissArrival(buildId),
      Math.max(0, arrivalShownAt + SOCIAL_ARRIVAL_MS - Date.now())
    );
    return () => clearTimeout(timer);
  }, [arrivalShownAt, buildId]);
  // "You're next" stays while it is true; every other note is a passing word.
  const visitStatus = visit?.status;
  useEffect(() => {
    if (!visitKey || visitStatus === 'waiting') return;
    const timer = setTimeout(() => setNoteHiddenFor(visitKey), VISIT_NOTE_MS);
    return () => clearTimeout(timer);
  }, [visitKey, visitStatus]);

  useEffect(() => {
    if (visit?.status !== 'waiting' || !visit.expiresAt) return;
    const timer = setTimeout(() => {
      const current = socialWalkupStore.get(buildId).visit;
      if (current?.status === 'waiting' && current.walkupId === visit.walkupId) {
        socialWalkupStore.setVisit(buildId, { ...current, status: 'later' });
      }
    }, Math.max(0, visit.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [buildId, visit]);

  // Leaving the app page ends this member's part: a visitor walks away, and
  // a host's waiting visitors are released (they are told, with no cooldown).
  const leaveRef = useRef<() => void>(() => {});
  leaveRef.current = () => {
    const current = socialWalkupStore.get(buildId);
    if (current.visit?.status === 'waiting' && current.visit.walkupId) {
      void walkAwayFromMember({ buildId, walkupId: current.visit.walkupId });
    }
    if (current.waiting.length > 0) void leaveSocialHost({ buildId });
    socialWalkupStore.clear(buildId);
  };
  useEffect(() => {
    if (!userId || !buildId || !active) return;
    return () => leaveRef.current();
  }, [active, buildId, userId]);

  useEffect(() => {
    if (state.waiting.length === 0) setListShown(false);
  }, [state.waiting.length]);

  const offChipWanted = !walkupsAllowed && !!ownJoinable && active;
  const [offChipExpired, setOffChipExpired] = useState(false);
  useEffect(() => {
    if (!offChipWanted) {
      setOffChipExpired(false);
      return;
    }
    // stays while its menu is open
    if (listShown) return;
    const timer = setTimeout(() => setOffChipExpired(true), OFF_CHIP_MS);
    return () => clearTimeout(timer);
  }, [listShown, offChipWanted]);

  if (!userId || !buildId || !active) return null;

  const banner = walkupsAllowed ? state.banner : null;
  const waiting = walkupsAllowed ? state.waiting : [];
  const note = visit && noteHiddenFor !== visitKey ? visit : null;
  // The app wants to be joinable but the viewer turned walk-ups off: one
  // quiet chip for a few seconds, so the choice can be found and undone.
  const offChip = offChipWanted && !offChipExpired;
  const arrival = state.arrival;
  if (!banner && waiting.length === 0 && !note && !offChip && !arrival)
    return null;

  return (
    <div className={layerClass} data-social-overlay>
      {arrival ? (
        <div
          key={arrival.matchKey}
          className="social-arrival"
          role="status"
          data-social-arrival
        >
          <span className="social-face">
            <ProfilePic
              userId={arrival.user.id}
              profilePicUrl={arrival.user.profilePicUrl || ''}
              activityBadgeShown={false}
              style={{ width: '100%', height: '100%' }}
            />
          </span>
          <span>{arrivalText(arrival.user.username)}</span>
        </div>
      ) : null}
      {note ? <VisitNote visit={note} onHide={handleHideNote} /> : null}
      {banner ? (
        <div className="social-card" role="status" data-social-banner>
          <WalkupFace person={banner.user} />
          <span className="social-line">
            {visitorBannerText({
              username: banner.user.username,
              joinable: ownJoinable
            })}
          </span>
          <button
            type="button"
            className="social-primary"
            onClick={() => socialWalkupStore.playNow(buildId, banner.id)}
          >
            Play now
          </button>
          <button
            type="button"
            className="social-quiet"
            aria-label="Not now"
            title="Not now"
            onClick={() => socialWalkupStore.dismissBanner(buildId)}
          >
            ×
          </button>
        </div>
      ) : waiting.length > 0 ? (
        <button
          type="button"
          className="social-chip"
          aria-expanded={listShown}
          data-social-chip
          onClick={() => setListShown((shown) => !shown)}
        >
          <span className="social-chip-faces" aria-hidden>
            {waiting.slice(0, 3).map((entry) => (
              <ProfilePic
                key={entry.id}
                userId={entry.user.id}
                profilePicUrl={entry.user.profilePicUrl || ''}
                activityBadgeShown={false}
                style={{ width: 28, height: 28 }}
              />
            ))}
          </span>
          {queueChipText(waiting.length)}
        </button>
      ) : offChip ? (
        <button
          type="button"
          className="social-chip"
          data-quiet="true"
          aria-expanded={listShown}
          onClick={() => setListShown((shown) => !shown)}
        >
          Walk-ups are off
        </button>
      ) : null}
      {listShown && !banner ? (
        <div className="social-list" data-social-list>
          {waiting.map((entry) => (
            <WaitingRow
              key={entry.id}
              entry={entry}
              onPlayNow={() => {
                socialWalkupStore.playNow(buildId, entry.id);
                setListShown(false);
              }}
            />
          ))}
          <button
            type="button"
            className="social-setting"
            role="switch"
            aria-checked={!walkupsAllowed}
            disabled={saving}
            onClick={handleToggleWalkups}
          >
            <span className="social-check" data-on={!walkupsAllowed} aria-hidden>
              {!walkupsAllowed ? '✓' : ''}
            </span>
            Don&apos;t let people walk up while I play
          </button>
        </div>
      ) : null}
    </div>
  );

  function handleHideNote() {
    // "You're next" has a way out: hiding it walks away.
    if (visit?.status === 'waiting' && visit.walkupId) {
      void walkAwayFromMember({ buildId, walkupId: visit.walkupId });
      socialWalkupStore.setVisit(buildId, null);
      return;
    }
    setNoteHiddenFor(visitKey);
  }

  async function handleToggleWalkups() {
    if (saving) return;
    setSaving(true);
    try {
      // The server's answer is what gets shown: no optimistic toggle.
      const result = await updateSocialSettings({ walkups: !walkupsAllowed });
      if (result?.settings) {
        onSetUserState({ userId, newState: { settings: result.settings } });
        if (result.settings?.social?.walkups === false) {
          void leaveSocialHost({ buildId });
          socialWalkupStore.setWaiting(buildId, []);
        }
      }
    } catch {
      // the setting stays as it was
    } finally {
      setSaving(false);
      setListShown(false);
    }
  }
}

function WaitingRow({
  entry,
  onPlayNow
}: {
  entry: WaitingVisitor;
  onPlayNow: () => void;
}) {
  return (
    <div className="social-list-row">
      <WalkupFace person={entry.user} />
      <span className="social-line">{entry.user.username}</span>
      <button type="button" className="social-primary" onClick={onPlayNow}>
        Play now
      </button>
    </div>
  );
}

function VisitNote({
  visit,
  onHide
}: {
  visit: SocialVisit;
  onHide: () => void;
}) {
  return (
    <div className="social-card social-note" role="status" data-social-note>
      <WalkupFace person={visit.host} />
      <span className="social-line">{visitLine(visit)}</span>
      <button
        type="button"
        className="social-quiet"
        aria-label={visit.status === 'waiting' ? 'Stop waiting' : 'Hide'}
        title={visit.status === 'waiting' ? 'Stop waiting' : 'Hide'}
        onClick={onHide}
      >
        ×
      </button>
    </div>
  );
}

// A face here opens the site's profile card like a name anywhere else: hover
// on desktop, tap on phones. Play now and the chip keep their own taps.
function WalkupFace({ person }: { person: SocialPerson }) {
  const { triggerRef, popup, onMouseEnter, onMouseLeave, onClick } =
    useUserPopupTrigger<HTMLSpanElement>({
      user: person as unknown as User
    });
  return (
    <span
      ref={triggerRef}
      className="social-face"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <ProfilePic
        userId={person.id}
        profilePicUrl={person.profilePicUrl || ''}
        activityBadgeShown={false}
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      />
      {popup}
    </span>
  );
}
