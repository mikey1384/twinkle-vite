import React from 'react';
import { ChatPinsContext } from './context';
import usePins from './usePins';
import PinsDialog from './PinsDialog';
import type { ChatPinScope } from '~/helpers/chatPins';
import { GENERAL_CHAT_ID } from '~/constants/defaultValues';

export default function ChatPinsProvider({
  children,
  ...scope
}: ChatPinScope & { children: React.ReactNode }) {
  const enabled = !!scope.channelId && scope.channelId !== GENERAL_CHAT_ID;
  const controller = usePins({
    ...scope,
    channelId: enabled ? scope.channelId : 0
  });
  return (
    <ChatPinsContext.Provider value={enabled ? controller : null}>
      {children}
      {enabled && controller.dialogShown && <PinsDialog />}
    </ChatPinsContext.Provider>
  );
}
