import { createContext, useContext } from 'react';

// Lets a card inside a chat send one line as the viewer's own ordinary
// message, through the same path as the message input (the shared-moment
// card's one-tap reply chips). null outside a chat the viewer can post in.
export type ChatQuickSend = (content: string, channelId: number) => Promise<void>;

export const ChatQuickSendContext = createContext<ChatQuickSend | null>(null);

export function useChatQuickSend() {
  return useContext(ChatQuickSendContext);
}
