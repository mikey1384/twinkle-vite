import { useCallback } from 'react';
import { useAppContext, useContentContext } from '~/contexts';

// The /users list returns only ids, and each ProfilePanel used to fetch its
// own profile and preview message after mounting, so every card opened from
// a short shell to full height while on screen (the page's scroll jank).
// The list now loads a page's profiles and previews together, in parallel,
// before showing its cards; ProfilePanel's own loading stays as the fallback
// and skips anything already loaded here.
export function useProfileHydrator() {
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);

  return useCallback(
    async (profileIds: number[]) => {
      await Promise.allSettled(profileIds.map(hydrate));

      async function hydrate(profileId: number) {
        const [profile, preview] = await Promise.allSettled([
          loadProfile(profileId),
          loadComments({
            contentId: profileId,
            contentType: 'user',
            isPreview: true,
            limit: 1
          })
        ]);
        if (profile.status === 'fulfilled' && profile.value) {
          onInitContent({
            contentType: 'user',
            contentId: profileId,
            ...profile.value
          });
          onSetUserState({
            userId: profileId,
            newState: { ...profile.value, loaded: true }
          });
        }
        if (preview.status === 'fulfilled' && preview.value) {
          onLoadComments({
            ...preview.value,
            contentId: profileId,
            contentType: 'user',
            isPreview: true
          });
        }
      }
    },
    [loadComments, loadProfile, onInitContent, onLoadComments, onSetUserState]
  );
}
