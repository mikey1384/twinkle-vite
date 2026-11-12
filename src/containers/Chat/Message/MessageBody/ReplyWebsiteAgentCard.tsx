import React, { useState } from 'react';
import { useChatContext, useKeyContext } from '~/contexts';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID, isWebsiteAgentEnabledFor } from '~/constants/defaultValues';
import WebsiteAgentCard, { isWebsiteAgentCardData, type WebsiteAgentCardData } from './WebsiteAgentCard';
import { parseMessageSettings } from './messageSettings';

export default function ReplyWebsiteAgentCard({ message }: { message: any }) {
  const myId = useKeyContext((v) => v.myState.userId);
  const channelId = Number(message?.channelId || 0);
  const messageId = Number(message?.id || 0);
  const sourceSettings = useChatContext((v) =>
    v.state.channelsObj?.[channelId]?.messagesObj?.[messageId]?.settings
  );
  const [updated, setUpdated] = useState<WebsiteAgentCardData | null>(null);
  const liveCard = parseMessageSettings(sourceSettings)?.websiteAgentCard;
  const savedCard = parseMessageSettings(message?.settings)?.websiteAgentCard;
  const card = isWebsiteAgentCardData(liveCard) ? liveCard : updated || savedCard;
  const senderId = Number(message?.userId || 0);
  if (!isWebsiteAgentEnabledFor(Number(myId)) ||
      ![ZERO_TWINKLE_ID, CIEL_TWINKLE_ID].includes(senderId) ||
      !channelId || !messageId || !isWebsiteAgentCardData(card)) return null;
  return <WebsiteAgentCard key={messageId} card={card} channelId={channelId}
    messageId={messageId} topicId={message.subjectId || null} messageText={message.content}
    assistantName={senderId === CIEL_TWINKLE_ID ? 'Ciel' : 'Zero'} onCardUpdated={setUpdated} />;
}
