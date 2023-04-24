import { createContext } from 'react';

const ChatContext = createContext<{
  actions: any;
  requests: any;
  state: any;
  inputState: any;
}>({ actions: {}, requests: {}, state: {}, inputState: {} });
export default ChatContext;
