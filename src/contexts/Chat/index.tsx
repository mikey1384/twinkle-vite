import React, { ReactNode, useReducer } from 'react';
import { createContext } from 'use-context-selector';
import ChatActions from './actions';
import ChatReducer from './reducer';

export const ChatContext = createContext({});

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
  chessTarget: null,
  classChannelIds: [],
  classLoadMoreButton: false,
  creatingNewDMChannel: false,
  customChannelNames: {},
  currentYear: null,
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
  userSearchResults: [],
  vocabFeedIds: [],
  vocabFeedObj: {},
  vocabFeedsLoadMoreButton: false,
  vocabErrorMessage: '',
  collectorRankings: { all: [], top30s: [] },
  monthlyVocabRankings: { all: [], top30s: [] },
  yearlyVocabRankings: { all: [], top30s: [] },
  wordRegisterStatus: null,
  wordleModalShown: false,
  wordsObj: {},
  wordLogs: [],
  zeroChannelId: null,
  prevUserId: null
};

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [chatState, chatDispatch] = useReducer(ChatReducer, initialChatState);
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
