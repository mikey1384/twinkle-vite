import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import MessagesContainer from './MessagesContainer';
import Collect from './Collect';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
import { mobileMaxWidth, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';

Body.propTypes = {
  channelName: PropTypes.string,
  partner: PropTypes.object,
  currentChannel: PropTypes.object,
  currentPathId: PropTypes.string,
  displayedThemeColor: PropTypes.string,
  isAICardModalShown: PropTypes.bool,
  onSetAICardModalCardId: PropTypes.func,
  subchannelId: PropTypes.number,
  subchannelPath: PropTypes.string
};

export default function Body({
  channelName,
  partner,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  isAICardModalShown,
  onSetAICardModalCardId,
  subchannelId,
  subchannelPath
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
            width: ${isUsingCollectSection ? '82vw' : '90vw'};
          }
        `}
      >
        {isUsingCollectSection ? (
          <Collect
            loadingVocabulary={loadingVocabulary}
            loadingAICardChat={loadingAICardChat}
            chatType={chatType}
          />
        ) : (
          <MessagesContainer
            key={currentChannel.id + subchannelPath}
            currentPathId={currentPathId}
            displayedThemeColor={displayedThemeColor}
            channelName={channelName}
            partner={partner}
            currentChannel={currentChannel}
            isAICardModalShown={isAICardModalShown}
            onSetAICardModalCardId={onSetAICardModalCardId}
            subchannelId={subchannelId}
            subchannelPath={subchannelPath}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
