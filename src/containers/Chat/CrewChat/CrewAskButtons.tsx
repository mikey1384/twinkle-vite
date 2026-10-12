import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import AssistantFace from '~/components/AssistantFace';
import { useAppContext, useKeyContext } from '~/contexts';
import { isWebsiteAgentEnabledFor } from '~/constants/defaultValues';
import { useUserAssistant } from '~/helpers/assistantVoice';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import type { CrewView } from '~/containers/BridgeBuilderQuest/types';
import {
  buildCrewAskText,
  requestCrewChatAsk,
  type CrewAssistantName
} from './crewAsk';

// "Ask Ciel" / "Ask Zero" on the crew's path: writes "@Ciel We're on step
// 3 ..." into this crew chat's message box (crewAsk.ts), the member's chosen
// assistant first. Sending it is the call; nothing opens.
export default function CrewAskButtons({
  crew,
  style
}: {
  crew: CrewView;
  style?: React.CSSProperties;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const preferred = useUserAssistant(userId);
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const { colorKey: accent } = useRoleColor('logoTwin', {
    fallback: 'logoBlue'
  });
  const channelId = Number(crew.chat?.channelId || 0);
  // Zero and Ciel answer only in an active crew's chat (a finished crew's
  // members are no longer active), so the buttons show only there.
  if (
    !channelId ||
    crew.status !== 'active' ||
    !isWebsiteAgentEnabledFor(userId)
  ) {
    return null;
  }
  const assistants: CrewAssistantName[] =
    preferred === 'Zero' ? ['Zero', 'Ciel'] : ['Ciel', 'Zero'];
  const current = crew.progress?.steps.find(
    (step) => step.key === crew.progress?.currentStep
  );
  return (
    <div
      className={css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      `}
      style={style}
    >
      {assistants.map((assistant) => (
        <Button
          key={assistant}
          color={accent}
          variant="soft"
          tone="raised"
          size="sm"
          shape="pill"
          uppercase={false}
          style={{ padding: '0.6rem 1rem' }}
          aria-label={`Ask ${assistant} about this step`}
          onClick={() => handleAsk(assistant)}
        >
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              font-weight: 700;
              font-size: 1.2rem;
            `}
          >
            <AssistantFace assistant={assistant} size="1.8rem" />
            Ask {assistant}
          </span>
        </Button>
      ))}
    </div>
  );

  function handleAsk(assistant: CrewAssistantName) {
    trackMeetupQuestView('crew_agent_ask');
    requestCrewChatAsk({
      channelId,
      text: buildCrewAskText({
        assistant,
        stepNumber: current?.number,
        stepLabel: current?.label,
        blocking: crew.progress?.blocking
      })
    });
  }
}
