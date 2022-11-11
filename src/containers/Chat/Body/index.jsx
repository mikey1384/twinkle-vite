import { memo, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import MessagesContainer from './MessagesContainer';
import Collect from './Collect';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
import { mobileMaxWidth, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { VOCAB_CHAT_TYPE, AI_IMAGE_CHAT_TYPE } from '~/constants/defaultValues';

Body.propTypes = {
  channelName: PropTypes.string,
  chessOpponent: PropTypes.object,
  currentChannel: PropTypes.object,
  currentPathId: PropTypes.string,
  displayedThemeColor: PropTypes.string,
  subchannelId: PropTypes.number,
  subchannelPath: PropTypes.string
};

function Body({
  channelName,
  chessOpponent,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  subchannelId,
  subchannelPath
}) {
  const {
    state: { chatType, loadingVocabulary }
  } = useContext(LocalContext);
  const isUsingCollectSection = useMemo(
    () => chatType === VOCAB_CHAT_TYPE || chatType === AI_IMAGE_CHAT_TYPE,
    [chatType]
  );

  return (
    <ErrorBoundary componentPath="Chat/Body/index">
      <div
        className={css`
          height: 100%;
          width: ${chatType === VOCAB_CHAT_TYPE ? '62vw' : '66vw'};
          border-left: 1px solid ${Color.borderGray()};
          padding: 0;
          position: relative;
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            width: ${chatType === VOCAB_CHAT_TYPE ? '82vw' : '90vw'};
          }
        `}
      >
        {loadingVocabulary ? (
          <Loading text="Loading Vocabulary" />
        ) : (
          <>
            {isUsingCollectSection ? (
              <Collect />
            ) : (
              <MessagesContainer
                key={currentChannel.id + subchannelPath}
                currentPathId={currentPathId}
                displayedThemeColor={displayedThemeColor}
                channelName={channelName}
                chessOpponent={chessOpponent}
                currentChannel={currentChannel}
                subchannelId={subchannelId}
                subchannelPath={subchannelPath}
              />
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Body);
