import { createContext } from 'react';

const ChatContext = createContext<{
  actions: any;
  requests: any;
  state: any;
}>({ actions: {}, requests: {}, state: {} });
export default ChatContext;
