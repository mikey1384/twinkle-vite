import React, { ReactNode, useReducer } from 'react';
import { createContext } from 'use-context-selector';
import ChatActions from './actions';
import ChatReducer from './reducer';

export const ChatContext = createContext({});

function getThinkHardFromStorage() {
  try {
    let stored = localStorage.getItem('thinkHard');

    if (!stored) {
      const oldData = localStorage.getItem('thinkHardPerTopic');
      const oldZero = localStorage.getItem('thinkHardZero');
      const oldCiel = localStorage.getItem('thinkHardCiel');

      if (oldData) {
        const oldParsed = JSON.parse(oldData);
        const migrated = {
          zero: {
            global: oldZero ? JSON.parse(oldZero) : false,
            ...oldParsed.zero
          },
          ciel: {
            global: oldCiel ? JSON.parse(oldCiel) : false,
            ...oldParsed.ciel
          }
        };
        localStorage.setItem('thinkHard', JSON.stringify(migrated));
        localStorage.removeItem('thinkHardPerTopic');
        localStorage.removeItem('thinkHardZero');
        localStorage.removeItem('thinkHardCiel');
        return migrated;
      }
    }

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
  return {
    aiCallChannelId: null,
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
    chatType: null,
    chessModalShown: false,
    chessTarget: null,
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
    userSearchResults: [],
    vocabFeedIds: [],
    vocabFeedObj: {},
    vocabFeedsLoadMoreButton: false,
    vocabErrorMessage: '',
    collectorRankings: { all: [], top30s: [] },
    monthlyVocabRankings: { all: [], top30s: [] },
    yearlyVocabRankings: { all: [], top30s: [] },
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
  chatType: null,
  chessModalShown: false,
  chessPuzzleModalShown: false,
  chessTarget: null,
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
  userSearchResults: [],
  vocabFeedIds: [],
  vocabFeedObj: {},
  vocabFeedsLoadMoreButton: false,
  vocabErrorMessage: '',
  collectorRankings: { all: [], top30s: [] },
  monthlyVocabRankings: { all: [], top30s: [] },
  yearlyVocabRankings: { all: [], top30s: [] },
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
  const [chatState, chatDispatch] = useReducer(
    ChatReducer,
    getInitialChatState()
  );

  return (
    <ChatContext.Provider
      value={{
        state: chatState,
        actions: ChatActions(chatDispatch)
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
