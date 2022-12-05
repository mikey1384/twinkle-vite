import { memo, useContext, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ChatInfo from './ChatInfo';
import VocabInfo from './VocabInfo';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import {
  AI_DRAWING_CHAT_TYPE,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import LocalContext from '../Context';
// import AICardInfo from './AICardInfo';

RightMenu.propTypes = {
  channelName: PropTypes.string,
  channelOnCall: PropTypes.object,
  currentChannel: PropTypes.object,
  currentChannelOnlineMembers: PropTypes.object,
  displayedThemeColor: PropTypes.string,
  selectedChannelId: PropTypes.number
};

function RightMenu({
  channelName,
  channelOnCall,
  currentChannel,
  currentChannelOnlineMembers,
  displayedThemeColor,
  selectedChannelId
}) {
  const { userId, twinkleXP } = useKeyContext((v) => v.myState);
  const {
    actions: { onGetRanks },
    requests: { loadRankings },
    state: { chatType }
  } = useContext(LocalContext);
  const MenuRef = useRef(null);
  const prevTwinkleXP = useRef(twinkleXP);

  useEffect(() => {
    MenuRef.current.scrollTop = 0;
  }, [currentChannel?.id]);

  useEffect(() => {
    handleLoadRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (
      typeof twinkleXP === 'number' &&
      twinkleXP > (prevTwinkleXP.current || 0)
    ) {
      handleLoadRankings();
    }
    prevTwinkleXP.current = twinkleXP;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkleXP]);

  const handleLoadRankings = useCallback(async () => {
    const {
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    } = await loadRankings();
    onGetRanks({
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu">
      <div
        ref={MenuRef}
        className={css`
          flex-grow: 1;
          max-width: 22vw;
          position: relative;
          background: #fff;
          border-left: 1px solid ${Color.borderGray()};
          overflow-y: scroll;
          -webkit-overflow-scrolling: touch;
          @media (max-width: ${mobileMaxWidth}) {
            width: ${chatType === VOCAB_CHAT_TYPE ? '48vw' : '40vw'};
          }
        `}
      >
        {/* chatType === AI_DRAWING_CHAT_TYPE ? <AICardInfo /> : null */}
        {chatType === VOCAB_CHAT_TYPE || chatType === AI_DRAWING_CHAT_TYPE ? (
          <VocabInfo />
        ) : null}
        {(!chatType || chatType === 'default') && (
          <ChatInfo
            channelName={channelName}
            channelOnCall={channelOnCall}
            currentChannel={currentChannel}
            currentChannelOnlineMembers={currentChannelOnlineMembers}
            displayedThemeColor={displayedThemeColor}
            selectedChannelId={selectedChannelId}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(RightMenu);
