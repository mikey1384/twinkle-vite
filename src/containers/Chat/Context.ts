import { createContext } from 'react';

const ChatContext = createContext<{
  actions: any;
  requests: any;
  state: any;
  onFileUpload: any;
}>({
  actions: {},
  requests: {},
  state: {},
  onFileUpload: null
});
export default ChatContext;
