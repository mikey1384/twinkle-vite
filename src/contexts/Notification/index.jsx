import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import NotiActions from './actions';
import NotiReducer from './reducer';

export const NotiContext = createContext();
export const initialNotiState = {
  versionMatch: true,
  notiObj: {},
  rewards: [],
  currentChatSubject: {},
  loadMoreRewards: false,
  numNewNotis: 0,
  numNewPosts: 0,
  rankingsLoaded: false,
  notificationsLoaded: false,
  allRanks: [],
  allMonthly: [],
  myAllTimeRank: null,
  myMonthlyRank: null,
  myAllTimeXP: 0,
  myMonthlyXP: 0,
  top30s: [],
  top30sMonthly: [],
  socketConnected: false,
  todayStats: {
    loaded: false,
    xpEarned: 0,
    coinsEarned: 0
  },
  updateDetail: '',
  updateNoticeShown: false
};

NotiContextProvider.propTypes = {
  children: PropTypes.node
};

export function NotiContextProvider({ children }) {
  const [notiState, notiDispatch] = useReducer(NotiReducer, initialNotiState);
  return (
    <NotiContext.Provider
      value={{
        state: notiState,
        actions: NotiActions(notiDispatch)
      }}
    >
      {children}
    </NotiContext.Provider>
  );
}
