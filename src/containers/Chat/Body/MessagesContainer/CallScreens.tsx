import React from 'react';
import HumanCallScreen from './CallScreen/Human';
import AICallScreen from './CallScreen/AI';
import { CALL_SCREEN_HEIGHT } from './constants';
import type { ChatPartner } from './types';

export default function CallScreens({
  partner,
  selectedChannelIsOnAICall,
  selectedChannelIsOnCall
}: {
  partner?: ChatPartner;
  selectedChannelIsOnAICall: boolean;
  selectedChannelIsOnCall: boolean;
}) {
  return (
    <>
      {selectedChannelIsOnCall && (
        <HumanCallScreen style={{ height: CALL_SCREEN_HEIGHT }} />
      )}
      {selectedChannelIsOnAICall && partner && (
        <AICallScreen
          partner={partner as any}
          style={{ height: CALL_SCREEN_HEIGHT }}
        />
      )}
    </>
  );
}
