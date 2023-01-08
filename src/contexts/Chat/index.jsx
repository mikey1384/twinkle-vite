import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import ChatActions from './actions';
import ChatReducer from './reducer';

export const ChatContext = createContext();

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

ChatContextProvider.propTypes = {
  children: PropTypes.node
};

export function ChatContextProvider({ children }) {
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
