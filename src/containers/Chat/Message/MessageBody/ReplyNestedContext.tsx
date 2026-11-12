import React, { useContext } from 'react';
import { useChatContext } from '~/contexts';
import TargetMessage, { RemovedTargetMessage } from './TargetMessage';
import TargetSubject from './TargetSubject';
import { ReplyTargetEnvironmentContext } from './ReplyTargetEnvironment';

// Render the same one-level quote and topic context the original message
// shows. Deeper reply chains stay collapsed, as they do in that original.
export default function ReplyNestedContext({ message, displayedThemeColor }: {
  message: any;
  displayedThemeColor: string;
}) {
  const environment = useContext(ReplyTargetEnvironmentContext);
  const channelId = Number(message?.channelId || environment?.channelId || 0);
  const messageId = Number(message?.id || 0);
  const live = useChatContext((v) => v.state.channelsObj?.[channelId]?.messagesObj?.[messageId]);
  const target = live?.targetMessage === null ? null
    : message?.targetMessage !== undefined ? message.targetMessage : live?.targetMessage;
  const targetId = Number(live?.targetMessageId || message?.targetMessageId || 0);
  const subject = live?.targetSubject !== undefined ? live.targetSubject : message?.targetSubject;
  return (
    <>
      {environment?.selectedTab !== 'topic' && subject ? <TargetSubject subject={subject} /> : null}
      {target ? (
        <div data-quote-own-click>
          <TargetMessage message={target} displayedThemeColor={displayedThemeColor} showNested={false} />
        </div>
      ) : target === null && targetId > 0 ? <RemovedTargetMessage /> : null}
    </>
  );
}
