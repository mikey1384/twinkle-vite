import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import { useKeyContext, useViewContext } from '~/contexts';
import Icon from '~/components/Icon';
import AssistantFace from '~/components/AssistantFace';
import { getHomeCallAssistant } from '~/helpers/aiVoiceCall';
import { quickAskShortcutLabel } from './state';
import { summonAssistant, useAssistantMode } from './assistantMode';
import { assistantModeLabel } from './AssistantModeBar';

// The member's own Zero or Ciel (the Home chooser, kept on the account and
// copied to this device), Zero when they never picked.
export function getHomeAgent(userId: number | null): 'Zero' | 'Ciel' {
  return getHomeCallAssistant(userId) || 'Zero';
}

// The way into Quick Ask: a small button in the desktop header (or Ctrl+K /
// ⌘K, see Host.tsx) and a row in the phone menu. Hidden when Zero isn't
// available to this member.
export function useQuickAskAvailable() {
  const userId = useKeyContext((v) => v.myState.userId);
  const aiChatBanned = useKeyContext(
    (v) => !!v.myState.banned?.aiChat || !!v.myState.banned?.all
  );
  const aiFeaturesDisabled = useViewContext((v) => v.state.aiFeaturesDisabled);
  return !!userId && !aiChatBanned && !aiFeaturesDisabled;
}

// Like every other way to call Zero or Ciel, these follow the member's one
// Temporary / Saved choice (summonAssistant), so the box that opens always
// matches the switch on the Home box (Mikey 11-23: "shouldnt these two
// align").
export function QuickAskHeaderButton() {
  const available = useQuickAskAvailable();
  const userId = useKeyContext((v) => v.myState.userId);
  const { mode } = useAssistantMode();
  if (!available) return null;
  const agent = getHomeAgent(userId);
  return (
    <button
      type="button"
      onClick={() => summonAssistant(agent)}
      title={`Quick Ask ${agent} (${quickAskShortcutLabel()}): ${assistantModeLabel(mode, agent)}`}
      aria-label={`Quick Ask ${agent}`}
      className={css`
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-right: 1.2rem;
        padding: 0.35rem 0.9rem 0.35rem 0.35rem;
        border: 1px solid ${Color.logoBlue(0.3)};
        border-radius: 999px;
        background: #fff;
        color: ${Color.logoBlue()};
        font-size: 1.3rem;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        cursor: pointer;
        transition:
          background 0.15s ease,
          border-color 0.15s ease;
        &:hover {
          background: ${Color.logoBlue(0.08)};
          border-color: ${Color.logoBlue(0.55)};
        }
        .quick-ask-label {
          display: inline;
        }
        @media (max-width: 1100px) {
          padding-right: 0.7rem;
          .quick-ask-label {
            display: none;
          }
        }
      `}
    >
      <AssistantFace assistant={agent} size="2.4rem" />
      <Icon icon="bolt" />
      <span className="quick-ask-label">Quick Ask</span>
    </button>
  );
}

export function QuickAskMenuRow({ onOpen }: { onOpen: () => void }) {
  const available = useQuickAskAvailable();
  const userId = useKeyContext((v) => v.myState.userId);
  const { mode } = useAssistantMode();
  if (!available) return null;
  const agent = getHomeAgent(userId);
  return (
    <button
      type="button"
      onClick={() => {
        onOpen();
        summonAssistant(agent);
      }}
      className={css`
        display: flex;
        align-items: center;
        gap: 1rem;
        // An inset card shaped like the menu rows below it (HomeMenuItems
        // nav), not full-width rules across the drawer (Mikey 11-23).
        width: calc(100% - 2rem);
        margin: 1rem 1rem 0;
        padding: 1rem 1.5rem;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        background: #fff;
        text-align: left;
        cursor: pointer;
      `}
    >
      <AssistantFace assistant={agent} size="3.6rem" />
      <span
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        `}
      >
        <span
          className={css`
            font-size: 1.7rem;
            font-weight: 700;
            color: ${Color.logoBlue()};
          `}
        >
          <Icon icon="bolt" style={{ marginRight: '.5rem' }} />
          Quick Ask {agent}
        </span>
        <span
          className={css`
            font-size: 1.2rem;
            color: ${Color.darkGray()};
          `}
        >
          {assistantModeLabel(mode, agent)}
        </span>
      </span>
    </button>
  );
}
