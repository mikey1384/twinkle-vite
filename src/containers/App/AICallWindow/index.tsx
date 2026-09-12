import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';
import { useChatContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

interface AICallWindowProps {
  initialPosition: { x: number; y: number };
}

export default function AICallWindow({ initialPosition }: AICallWindowProps) {
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const cielChannelId = useChatContext((v) => v.state.cielChannelId);
  const assistantName = useChatContext((v) => v.state.aiCallAssistantName);
  const ending = useChatContext((v) => v.state.aiCallEnding);
  const onSetAICallEnding = useChatContext((v) => v.actions.onSetAICallEnding);

  return ReactDOM.createPortal(
    <Window
      initialPosition={initialPosition}
      assistantName={
        assistantName || (aiCallChannelId === cielChannelId ? 'Ciel' : 'Zero')
      }
      ending={ending}
      onHangUp={() => {
        if (ending) return;
        onSetAICallEnding(true);
        socket.emit('ai_end_ai_voice_conversation');
      }}
    />,
    document.body
  );
}
