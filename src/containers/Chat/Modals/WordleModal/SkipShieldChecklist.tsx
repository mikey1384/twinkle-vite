import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import {
  isSkipShieldChecklistItemDone,
  isSkipShieldReady,
  type SkipShieldChecklistState
} from './skipShieldStatus';

export type { SkipShieldChecklistState } from './skipShieldStatus';

export default function SkipShieldChecklist({
  checklist,
  compact = false,
  bare = false
}: {
  checklist: SkipShieldChecklistState;
  compact?: boolean;
  bare?: boolean;
}) {
  const navigate = useNavigate();
  const ready = isSkipShieldReady(checklist);
  const builtDone = isSkipShieldChecklistItemDone(
    checklist,
    'builtWithLumineToday'
  );
  const triedDone = isSkipShieldChecklistItemDone(
    checklist,
    'triedPeerBuildToday'
  );

  if (compact) {
    return (
      <section
        aria-label="Wordle skip protection status"
        className={css`
          width: ${bare ? '100%' : 'calc(100% - 4rem)'};
          margin: ${bare ? '0' : '1rem 2rem 0'};
          padding: 0.8rem 1rem;
          border: 1px solid
            ${ready ? Color.limeGreen(0.65) : Color.borderGray()};
          border-radius: ${borderRadius};
          background: ${ready ? Color.limeGreen(0.08) : Color.whiteGray()};
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.6rem;
          `}
        >
          <strong>Skip protection</strong>
          <span
            className={css`
              color: ${ready ? Color.limeGreen() : Color.darkerGray()};
              font-weight: bold;
            `}
          >
            {ready ? 'Ready' : 'Complete both today'}
          </span>
        </div>
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem 1.4rem;
          `}
        >
          <CompactStatus done={builtDone} label="Built with Lumine today" />
          <CompactStatus done={triedDone} label="Tried a member's app today" />
        </div>
        <p
          className={css`
            margin-top: 0.6rem;
            color: ${Color.darkerGray()};
            font-size: 1.1rem;
          `}
        >
          {ready
            ? "You're protected if you leave today's word unfinished."
            : 'Finish both before leaving the word unfinished to protect your streak.'}
        </p>
      </section>
    );
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      `}
    >
      <ChecklistRow
        done={builtDone}
        label="Build something with Lumine today 🤖"
        detail={
          builtDone
            ? 'completed today — new projects and updates both count'
            : checklist.metLumine
              ? 'start a new project or improve one you already have'
              : 'your first build chat works even with an empty battery'
        }
        actionLabel="Open Build"
        onAction={() => navigate('/build?sayHi=lumine')}
      />
      <ChecklistRow
        done={triedDone}
        label="Try an app another member built today 🎮"
        detail="any app on the Build page counts"
        actionLabel="Explore apps"
        onAction={() => navigate('/build')}
      />
    </div>
  );
}

function CompactStatus({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: ${done ? Color.limeGreen() : Color.darkerGray()};
        font-weight: bold;
      `}
    >
      <Icon icon={done ? 'check-circle' : ['far', 'circle']} />
      {label}
    </span>
  );
}

function ChecklistRow({
  done,
  label,
  detail,
  actionLabel,
  onAction
}: {
  done: boolean;
  label: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid ${done ? Color.limeGreen() : Color.borderGray()};
        border-radius: ${borderRadius};
        background: ${done ? Color.limeGreen(0.08) : Color.whiteGray()};
      `}
    >
      <Icon
        icon={done ? 'check-circle' : ['far', 'circle']}
        style={{
          fontSize: '1.7rem',
          color: done ? Color.limeGreen() : Color.gray()
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{label}</div>
        <div style={{ color: Color.gray(), marginTop: '0.2rem' }}>{detail}</div>
      </div>
      {!done && (
        <Button variant="soft" color="logoBlue" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
