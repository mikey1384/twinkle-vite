import { useCallback } from 'react';
import { useAppContext, useContentContext } from '~/contexts';

// The Users page's cards arrive complete from the server (/user/users and
// /user/users/search?withCards=1): the profile, its latest board message and,
// for a signed-in viewer, the friend button's state. This stores them where
// ProfilePanel and FriendButton read, so no card asks for anything itself and
// none opens to full height on screen. A card the server could not complete
// (no profile) is left to ProfilePanel's own loading.
export function useApplyUserCards() {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);

  return useCallback(
    (cards: unknown) => {
      if (!Array.isArray(cards)) return;
      for (const card of cards) {
        const userId = Number(card?.id);
        // a bare row (the paging marker) is not a card
        if (!(userId > 0) || !card.username) continue;
        const { previewComments, ...profile } = card;
        onInitContent({ contentType: 'user', contentId: userId, ...profile });
        onSetUserState({ userId, newState: { ...profile, loaded: true } });
        if (previewComments) {
          onLoadComments({
            ...previewComments,
            contentId: userId,
            contentType: 'user',
            isPreview: true
          });
        }
      }
    },
    [onInitContent, onLoadComments, onSetUserState]
  );
}
