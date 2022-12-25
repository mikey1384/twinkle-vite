import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import ChatActions from './actions';
import ChatReducer from './reducer';

export const ChatContext = createContext();

export const initialChatState = {
  aiCardIds: [],
  aiCardsLoadMoreButton: false,
  allFavoriteChannelIds: {},
  classLoadMoreButton: false,
  chatStatus: {},
  channelPathIdHash: {},
  favoriteLoadMoreButton: false,
  homeLoadMoreButton: false,
  classChannelIds: [],
  favoriteChannelIds: [],
  homeChannelIds: [],
  channelLoading: false,
  channelsObj: {},
  channelOnCall: {},
  chatSearchResults: [],
  chatType: null,
  chessModalShown: false,
  chessTarget: null,
  creatingNewDMChannel: false,
  currentChannelName: '',
  customChannelNames: {},
  filesBeingUploaded: {},
  lastSubchannelPaths: {},
  loadingAIImageChat: false,
  loadingVocabulary: false,
  loaded: false,
  messages: [],
  cardObj: {},
  listedCardIds: [],
  listedCardsLoadMoreButton: false,
  myCardIds: [],
  myCardsLoadMoreButton: false,
  myListedCardIds: [],
  myListedCardsLoadMoreButton: false,
  numUnreads: 0,
  incomingOfferCardIds: [],
  incomingOffersLoadMoreButton: false,
  outgoingOfferCardIds: [],
  outgoingOffersLoadMoreButton: false,
  peerStreams: {},
  recepientId: null,
  replyTarget: null,
  myStream: null,
  selectedChannelId: null,
  selectedChatTab: 'home',
  subjectSearchResults: [],
  aiImageErrorMessage: '',
  aiImageStatusMessage: '',
  isGeneratingAICard: false,
  vocabErrorMessage: '',
  wordCollectors: {},
  wordRegisterStatus: undefined,
  wordleModalShown: false,
  wordsObj: {},
  userSearchResults: [],
  vocabActivities: [],
  vocabActivitiesLoadMoreButton: false
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
