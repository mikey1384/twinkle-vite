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

  return ReactDOM.createPortal(
    <Window
      initialPosition={initialPosition}
      onHangUp={() => {
        onSetAICall(null);
        socket.emit('ai_end_ai_voice_conversation');
      }}
    />,
    document.body
  );
}
