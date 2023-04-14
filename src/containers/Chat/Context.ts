import { createContext } from 'react';

const ChatContext = createContext<{
  state: any;
}>({ state: {} });
export default ChatContext;
