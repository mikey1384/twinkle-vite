import React, { ReactNode, useReducer } from 'react';
import { createContext } from 'use-context-selector';
import ChatActions from './actions';
import ChatReducer from './reducer';

export const ChatContext = createContext({});

export const initialChatState = {
  aiCardErrorMessage: '',
  aiCardFeeds: [],
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
  currentChannelName: '',
  customChannelNames: {},
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
  vocabActivities: [],
  vocabActivitiesLoadMoreButton: false,
  vocabErrorMessage: '',
  wordCollectors: {},
  wordRegisterStatus: null,
  wordleModalShown: false,
  wordsObj: {}
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
