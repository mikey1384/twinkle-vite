import { memo, useContext, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ChatInfo from './ChatInfo';
import VocabInfo from './VocabInfo';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import LocalContext from '../Context';

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
  }, [currentChannel.id]);

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
    <div
      ref={MenuRef}
      className={css`
        width: ${chatType === 'vocabulary' ? '22vw' : '18vw'};
        position: relative;
        background: #fff;
        border-left: 1px solid ${Color.borderGray()};
        overflow-y: scroll;
        -webkit-overflow-scrolling: touch;
        @media (max-width: ${mobileMaxWidth}) {
          width: ${chatType === 'vocabulary' ? '43vw' : '35vw'};
        }
      `}
    >
      {chatType === 'vocabulary' && <VocabInfo />}
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
  );
}

export default memo(RightMenu);
