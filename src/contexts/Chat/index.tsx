import React, { ReactNode, useEffect, useReducer, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import ChatActions from './actions';
import ChatReducer from './reducer';
import { recordChatBootstrapEvent } from '~/helpers/chatBootstrapDebug';

export const ChatContext = createContext({});

interface ChatStateWindow extends Window {
  __twinkleChatStateSnapshot?: any;
}

function getChatStateWindow() {
  if (typeof window === 'undefined') return null;
  return window as ChatStateWindow;
}

function getPersistedChatStateSnapshot() {
  return getChatStateWindow()?.__twinkleChatStateSnapshot || null;
}

function persistChatStateSnapshot(state: any) {
  const targetWindow = getChatStateWindow();
  if (!targetWindow) return;
  targetWindow.__twinkleChatStateSnapshot = state;
}

function getThinkHardFromStorage() {
  try {
    let stored = localStorage.getItem('thinkHard');
    if (!stored) return { zero: { global: false }, ciel: { global: false } };
    const parsed = JSON.parse(stored);

    if (
      typeof parsed !== 'object' ||
      !parsed ||
      typeof parsed.zero !== 'object' ||
      typeof parsed.ciel !== 'object'
    ) {
      throw new Error('Invalid structure');
    }

    if (!parsed.zero.hasOwnProperty('global')) parsed.zero.global = false;
    if (!parsed.ciel.hasOwnProperty('global')) parsed.ciel.global = false;

    return parsed;
  } catch (error) {
    console.error('Error parsing thinkHard from localStorage:', error);
    localStorage.removeItem('thinkHard');
    return { zero: { global: false }, ciel: { global: false } };
  }
}

function getInitialChatState() {
  const persistedState = getPersistedChatStateSnapshot();
  if (persistedState && typeof persistedState === 'object') {
    recordChatBootstrapEvent('chat-context-restored-snapshot', {
      loaded: persistedState.loaded,
      loadedForUserId: persistedState.loadedForUserId,
      selectedChannelId: persistedState.selectedChannelId,
      channelCount: Object.keys(persistedState.channelsObj || {}).length
    });
    return persistedState;
  }

  return {
    aiCallChannelId: null,
    aiCallEnding: false,
    aiCardErrorMessage: '',
    aiCardFeedIds: [],
    aiCardFeedObj: {},
    aiCardStatusMessage: '',
    aiCardLoadMoreButton: false,
    allFavoriteChannelIds: {},
    cardObj: {},
    channelLoading: false,
    channelOnCall: {},
    channelPathIdHash: {},
    channelsObj: {},
    chatSearchResults: [],
    chatStatus: {},
    collectPreviews: {},
    recentOfflineUsers: [],
    chatType: null,
    chessModalShown: false,
    chessTarget: null,
    omokModalShown: false,
    omokTarget: null,
    classChannelIds: [],
    classLoadMoreButton: false,
    creatingNewDMChannel: false,
    customChannelNames: {},
    currentYear: null,
    currentMonth: null,
    acceptedTransactions: {},
    cancelledTransactions: {},
    favoriteChannelIds: [],
    favoriteLoadMoreButton: false,
    filesBeingUploaded: {},
    homeChannelIds: [],
    homeLoadMoreButton: false,
    incomingOffers: [],
    incomingOffersLoadMoreButton: false,
    isGeneratingAICard: false,
    latestPathId: null,
    lastSubchannelPaths: {},
    listedCardIds: [],
    listedCardsLoadMoreButton: false,
    loadingAICardChat: false,
    loadingVocabulary: false,
    loaded: false,
    loadedForUserId: null,
    myCardIds: [],
    myCardsLoadMoreButton: false,
    myListedCardIds: [],
    myListedCardsLoadMoreButton: false,
    myStream: null,
    mostRecentOfferTimeStamp: 0,
    numCardSummonedToday: 0,
    numUnreads: 0,
    outgoingOffers: [],
    outgoingOffersLoadMoreButton: false,
    peerStreams: {},
    recipientId: null,
    replyTarget: null,
    selectedChannelId: null,
    selectedChatTab: 'home',
    subjectSearchResults: [],
    thinkHard: getThinkHardFromStorage(),
    chessThemeVersion: 0,
    userSearchResults: [],
    vocabFeedIds: [],
    vocabFeedObj: {},
    vocabFeedsLoadMoreButton: false,
    vocabErrorMessage: '',
    visitedChannelIds: {},
    collectorRankings: { all: [], top30s: [] },
    monthlyVocabRankings: { all: [], top30s: [] },
    yearlyVocabRankings: { all: [], top30s: [] },
    vocabRankingsLoaded: false,
    vocabLeaderboardTab: 'month',
    vocabLeaderboardAllSelected: {
      month: false,
      year: false
    },
    wordRegisterStatus: null,
    wordleModalShown: false,
    wordsObj: {},
    wordLogs: [],
    zeroChannelId: null,
    prevUserId: null
  };
}

export const initialChatState = {
  aiCallChannelId: null,
  aiCallEnding: false,
  aiCardErrorMessage: '',
  aiCardFeedIds: [],
  aiCardFeedObj: {},
  aiCardStatusMessage: '',
  aiCardLoadMoreButton: false,
  allFavoriteChannelIds: {},
  cardObj: {},
  channelLoading: false,
  channelOnCall: {},
  channelPathIdHash: {},
  channelsObj: {},
  chatSearchResults: [],
  chatStatus: {},
  collectPreviews: {},
  recentOfflineUsers: [],
  chatType: null,
  chessModalShown: false,
  chessPuzzleModalShown: false,
  chessTarget: null,
  omokModalShown: false,
  omokTarget: null,
  classChannelIds: [],
  classLoadMoreButton: false,
  creatingNewDMChannel: false,
  customChannelNames: {},
  currentYear: null,
  currentMonth: null,
  acceptedTransactions: {},
  cancelledTransactions: {},
  favoriteChannelIds: [],
  favoriteLoadMoreButton: false,
  filesBeingUploaded: {},
  homeChannelIds: [],
  homeLoadMoreButton: false,
  incomingOffers: [],
  incomingOffersLoadMoreButton: false,
  isGeneratingAICard: false,
  latestPathId: null,
  lastSubchannelPaths: {},
  listedCardIds: [],
  listedCardsLoadMoreButton: false,
  loadingAICardChat: false,
  loadingVocabulary: false,
  loaded: false,
  loadedForUserId: null,
  myCardIds: [],
  myCardsLoadMoreButton: false,
  myListedCardIds: [],
  myListedCardsLoadMoreButton: false,
  myStream: null,
  mostRecentOfferTimeStamp: 0,
  numCardSummonedToday: 0,
  numUnreads: 0,
  outgoingOffers: [],
  outgoingOffersLoadMoreButton: false,
  peerStreams: {},
  recipientId: null,
  replyTarget: null,
  selectedChannelId: null,
  selectedChatTab: 'home',
  subjectSearchResults: [],
  thinkHard: { zero: { global: false }, ciel: { global: false } },
  chessThemeVersion: 0,
  userSearchResults: [],
  vocabFeedIds: [],
  vocabFeedObj: {},
  vocabFeedsLoadMoreButton: false,
  vocabErrorMessage: '',
  visitedChannelIds: {},
  collectorRankings: { all: [], top30s: [] },
  monthlyVocabRankings: { all: [], top30s: [] },
  yearlyVocabRankings: { all: [], top30s: [] },
  vocabRankingsLoaded: false,
  vocabLeaderboardTab: 'month',
  vocabLeaderboardAllSelected: {
    month: false,
    year: false
  },
  wordRegisterStatus: null,
  wordleModalShown: false,
  wordsObj: {},
  wordLogs: [],
  zeroChannelId: null,
  prevUserId: null
};

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [chatState, chatDispatch] = useReducer(ChatReducer, undefined, () =>
    getInitialChatState()
  );

  useEffect(() => {
    recordChatBootstrapEvent('chat-context-mounted', {});
    return () => {
      recordChatBootstrapEvent('chat-context-unmounted', {});
    };
  }, []);

  useEffect(() => {
    persistChatStateSnapshot(chatState);
  }, [chatState]);

  const memoizedActions = useMemo(
    () => ChatActions(chatDispatch),
    [chatDispatch]
  );

  const contextValue = useMemo(
    () => ({
      state: chatState,
      actions: memoizedActions
    }),
    [chatState, memoizedActions]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}
