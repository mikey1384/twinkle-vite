import { memo, useContext } from 'react';
import PropTypes from 'prop-types';
import MessagesContainer from './MessagesContainer';
import Vocabulary from './Vocabulary';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
import { mobileMaxWidth, Color } from '~/constants/css';
import { css } from '@emotion/css';

Body.propTypes = {
  channelName: PropTypes.string,
  chessOpponent: PropTypes.object,
  currentChannel: PropTypes.object,
  currentPathId: PropTypes.string,
  displayedThemeColor: PropTypes.string,
  loading: PropTypes.bool
};

function Body({
  channelName,
  chessOpponent,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  loading
}) {
  const {
    state: { chatType, loadingVocabulary }
  } = useContext(LocalContext);

  return (
    <ErrorBoundary componentPath="Chat/Body/index">
      <div
        className={css`
          height: 100%;
          width: ${chatType === 'vocabulary' ? '62vw' : '66vw'};
          border-left: 1px solid ${Color.borderGray()};
          padding: 0;
          position: relative;
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            width: ${chatType === 'vocabulary' ? '77vw' : '85vw'};
          }
        `}
      >
        {loadingVocabulary ? (
          <Loading text="Loading Vocabulary" />
        ) : (
          <>
            {chatType === 'vocabulary' ? (
              <Vocabulary />
            ) : (
              <MessagesContainer
                key={currentChannel.id}
                currentPathId={currentPathId}
                displayedThemeColor={displayedThemeColor}
                loading={loading}
                channelName={channelName}
                chessOpponent={chessOpponent}
                currentChannel={currentChannel}
              />
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Body);
