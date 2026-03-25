import React from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';
import { useChatContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

interface AICallWindowProps {
  initialPosition: { x: number; y: number };
}

export default function AICallWindow({ initialPosition }: AICallWindowProps) {
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);
  const onSetAICallEnding = useChatContext(
    (v) => v.actions.onSetAICallEnding
  );

  return ReactDOM.createPortal(
    <Window
      initialPosition={initialPosition}
      onHangUp={() => {
        onSetAICallEnding(true);
        onSetAICall(null);
        socket.emit('ai_end_ai_voice_conversation');
      }}
    />,
    document.body
  );
}
