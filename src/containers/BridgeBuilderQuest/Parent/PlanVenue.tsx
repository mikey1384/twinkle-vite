import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { questHelpClass, questInputClass, questLabelClass } from '../StepCard';

export type VenueMode = 'academy' | 'home' | 'other';

const ACADEMY_AREA = /^twinkle (.+) branch classroom$/i;
// a member's home is stored as "Home · <neighbourhood>"
const HOME_PREFIX = 'Home · ';

// The plan's "where": only the two places that have a guardian there by
// default (the server enforces the same list); each leads to its own later
// steps. Stored as the plan's area text; `rest` is the neighbourhood. A plan
// from before this list is 'other' and must be re-chosen.
export function venueFromArea(area: string): { mode: VenueMode; branch: string; rest: string } {
  const text = String(area || '').trim();
  const match = ACADEMY_AREA.exec(text);
  if (match) return { mode: 'academy', branch: match[1], rest: '' };
  if (text.toLowerCase().startsWith(HOME_PREFIX.toLowerCase())) {
    return { mode: 'home', branch: '', rest: text.slice(HOME_PREFIX.length) };
  }
  return { mode: text ? 'other' : 'academy', branch: '', rest: '' };
}

export function areaForVenue(mode: VenueMode, branch: string, other: string) {
  if (mode === 'academy') return branch ? `Twinkle ${branch} branch classroom` : '';
  return mode === 'home' && other.trim() ? `${HOME_PREFIX}${other.trim()}` : '';
}

export default function PlanVenue({
  mode,
  branch,
  other,
  onMode,
  onBranch,
  onOther
}: {
  mode: VenueMode;
  branch: string;
  other: string;
  onMode: (next: VenueMode) => void;
  onBranch: (next: string) => void;
  onOther: (next: string) => void;
}) {
  const loadMeetupBranchChoices = useAppContext((v) => v.requestHelpers.loadMeetupBranchChoices);
  const [branches, setBranches] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    loadMeetupBranchChoices()
      .then((data: { official?: { name: string }[] }) => {
        if (active) setBranches((data?.official || []).map((item) => item.name));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const option = (value: VenueMode, title: string, text: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => onMode(value)}
      className={css`
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        padding: 0.9rem 1.2rem;
        border-radius: 1rem;
        border: 1.5px solid ${mode === value ? Color.logoBlue() : 'var(--ui-border)'};
        background: ${mode === value ? Color.logoBlue(0.07) : '#fff'};
      `}
    >
      <b style={{ fontSize: '1.4rem', color: Color.black() }}>{title}</b>
      <div style={{ fontSize: '1.25rem', color: Color.darkerGray() }}>{text}</div>
    </button>
  );
  return (
    <div>
      <span className={questLabelClass}>Where will you meet?</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {option(
          'academy',
          'A Twinkle classroom, with a teacher (recommended)',
          'Staff offer a classroom and time slots, and you meet only in a slot they confirm.'
        )}
        {mode === 'academy' && (
          <div role="group" aria-label="Twinkle branch" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingLeft: '0.4rem' }}>
            {branches.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={branch === name}
                onClick={() => onBranch(name)}
                className={css`
                  cursor: pointer;
                  font-family: inherit;
                  font-size: 1.3rem;
                  font-weight: bold;
                  padding: 0.4rem 1.1rem;
                  border-radius: 2rem;
                  color: ${branch === name ? '#fff' : Color.darkerGray()};
                  background: ${branch === name ? Color.logoBlue() : '#fff'};
                  border: 1.5px solid ${branch === name ? Color.logoBlue() : 'var(--ui-border)'};
                `}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {option(
          'home',
          "A member's home, with a parent there",
          'A parent has to offer their home and be the grown-up there.'
        )}
        {mode === 'home' && (
          <div style={{ paddingLeft: '0.4rem' }}>
            <input
              className={questInputClass}
              maxLength={50}
              value={other}
              placeholder="A neighbourhood, for example: Mokdong"
              aria-label="General area"
              onChange={(event) => onOther(event.target.value)}
            />
            <div className={questHelpClass}>
              <Icon icon="location-dot" /> Neighbourhood only. Never an exact address: your crew can share the exact
              spot with the parent who hosts.
            </div>
          </div>
        )}
        {mode === 'other' && (
          <div className={questHelpClass}>
            This plan uses an older kind of place. Choose one of the two places above.
          </div>
        )}
        <div className={questHelpClass}>
          You can pick either one. After you send the plan, different steps follow depending on your choice.
        </div>
      </div>
    </div>
  );
}
