import React, { useContext, useMemo } from 'react';
import MessagesContainer from './MessagesContainer';
import Collect from './Collect';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
import { mobileMaxWidth, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';
import { User } from '~/types';

export default function Body({
  channelName,
  debugLogs,
  partner,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  isAICardModalShown,
  onSetAICardModalCardId,
  subchannelId,
  subchannelPath,
  topicSelectorModalShown,
  onSetTopicSelectorModalShown
}: {
  channelName?: string;
  debugLogs: string[];
  partner?: User;
  currentChannel: any;
  currentPathId: string | number;
  displayedThemeColor: string;
  isAICardModalShown: boolean;
  onSetAICardModalCardId: (v: number) => void;
  subchannelId?: number;
  subchannelPath?: string;
  topicSelectorModalShown: boolean;
  onSetTopicSelectorModalShown: (v: boolean) => void;
}) {
  const {
    state: { chatType, loadingVocabulary, loadingAICardChat }
  } = useContext(LocalContext);
  const isUsingCollectSection = useMemo(
    () => chatType === VOCAB_CHAT_TYPE || chatType === AI_CARD_CHAT_TYPE,
    [chatType]
  );

  return (
    <ErrorBoundary componentPath="Chat/Body/index">
      <div
        className={css`
          height: 100%;
          width: ${isUsingCollectSection ? '62vw' : '66vw'};
          border-left: 1px solid ${Color.borderGray()};
          padding: 0;
          position: relative;
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            width: ${isUsingCollectSection ? '100vw' : '90vw'};
          }
        `}
      >
        {isUsingCollectSection ? (
          <Collect
            loadingVocabulary={loadingVocabulary}
            loadingAICardChat={loadingAICardChat}
            chatType={chatType}
            displayedThemeColor={displayedThemeColor}
          />
        ) : (
          <MessagesContainer
            key={currentChannel.id + subchannelPath}
            currentPathId={currentPathId}
            debugLogs={debugLogs}
            displayedThemeColor={displayedThemeColor}
            channelName={channelName}
            partner={partner}
            currentChannel={currentChannel}
            isAICardModalShown={isAICardModalShown}
            onSetAICardModalCardId={onSetAICardModalCardId}
            subchannelId={subchannelId}
            subchannelPath={subchannelPath}
            topicSelectorModalShown={topicSelectorModalShown}
            onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
