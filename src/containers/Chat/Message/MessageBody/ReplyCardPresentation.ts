import { createContext, useContext } from 'react';

// Original cards can adjust their spacing when they are embedded in a reply,
// without changing their data, actions or normal standalone appearance.
export const ReplyCardPresentationContext = createContext(false);

export function useReplyCardPresentation() {
  return useContext(ReplyCardPresentationContext);
}
