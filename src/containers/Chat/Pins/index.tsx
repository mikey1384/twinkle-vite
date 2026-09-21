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
  if (!scope.channelId || scope.channelId === GENERAL_CHAT_ID) {
    return (
      <ChatPinsContext.Provider value={null}>
        {children}
      </ChatPinsContext.Provider>
    );
  }
  return <EnabledPinsProvider {...scope}>{children}</EnabledPinsProvider>;
}

function EnabledPinsProvider({
  children,
  ...scope
}: ChatPinScope & { children: React.ReactNode }) {
  const controller = usePins(scope);
  return (
    <ChatPinsContext.Provider value={controller}>
      {children}
      {controller.dialogShown && <PinsDialog />}
    </ChatPinsContext.Provider>
  );
}
