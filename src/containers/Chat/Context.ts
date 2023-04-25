import { createContext } from 'react';

const ChatContext = createContext<{
  actions: any;
  requests: any;
  state: any;
  inputState: any;
  onFileUpload: any;
}>({
  actions: {},
  requests: {},
  state: {},
  inputState: {},
  onFileUpload: null
});
export default ChatContext;
