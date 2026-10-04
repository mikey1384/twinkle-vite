import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import AssistantFace from '~/components/AssistantFace';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useChatContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { isWebsiteAgentEnabledFor } from '~/constants/defaultValues';
import {
  openAssistantDock,
  type AssistantAskContext
} from '~/containers/App/AssistantDock/dockState';
import { useUserAssistant } from '~/helpers/assistantVoice';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

// THE "ask the agent" button, for every place a member might want help: it is
// Zero or Ciel (whichever they chose on Home) and it opens the same floating
// agent window the Home ask box continues into, with `context` attached so the
// agent knows what "this" is. No menu of its own: the conversation is the
// interface.
export default function AskAgentButton({
  context,
  style,
  hideLabel,
  label,
  onClick
}: {
  context: AssistantAskContext;
  style?: React.CSSProperties;
  hideLabel?: boolean;
  // overrides the default "Ask Zero" text (e.g. "Help me plan")
  label?: string;
  // runs first (e.g. closing the modal the button sits in, so the agent
  // window is not under it)
  onClick?: () => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const assistant = useUserAssistant(userId);
  const channelId = useChatContext((v) =>
    assistant === 'Ciel' ? v.state.cielChannelId : v.state.zeroChannelId
  );
  const { colorKey: accent } = useRoleColor('logoTwin', {
    fallback: 'logoBlue'
  });
  // the same gate as Home's ask box; no room to talk in yet means no button
  if (!isWebsiteAgentEnabledFor(userId) || !channelId) return null;
  const text = label || `Ask ${assistant}`;
  return (
    <ErrorBoundary componentPath="Buttons/AskAgentButton">
      <Button
        className={css`
          display: inline-flex;
          flex-shrink: 0;
          white-space: nowrap;
        `}
        style={{ padding: '0.7rem 1.1rem', ...style }}
        color={accent}
        variant="soft"
        tone="raised"
        size="md"
        shape="pill"
        uppercase={false}
        onClick={() => {
          onClick?.();
          openAssistantDock(assistant, context);
        }}
        aria-label={text}
      >
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
          `}
        >
          <AssistantFace assistant={assistant} size="2rem" />
          {!hideLabel && (
            <span
              className={css`
                font-weight: 700;
                letter-spacing: 0.02em;
                @media (max-width: ${mobileMaxWidth}) {
                  display: none;
                }
              `}
            >
              {text}
            </span>
          )}
        </span>
      </Button>
    </ErrorBoundary>
  );
}
