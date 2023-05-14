import React, { useEffect, useState } from 'react';
import { useProfileState } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useProfileContext
} from '~/contexts';
import Loading from '~/components/Loading';

export default function UserComponent({ src }: { src: string }) {
  const [loading, setLoading] = useState(false);
  const loadProfileViaUsername = useAppContext(
    (v) => v.requestHelpers.loadProfileViaUsername
  );
  const profile = useAppContext((v) => v.user.state.userObj[profileId] || {});
  const onUserNotExist = useProfileContext((v) => v.actions.onUserNotExist);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetProfileId = useProfileContext((v) => v.actions.onSetProfileId);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const parts = src.split('/');
  const username = parts[2];
  const pageType = parts[3];
  const subPageType = parts[4];
  const { notExist, profileId } = useProfileState(username || '');

  useEffect(() => {
    let retries = 0;
    const maxRetries = 3;

    if (!notExist && !profile.loaded) {
      loadProfile();
    }

    async function loadProfile() {
      setLoading(true);
      try {
        const { pageNotExists, user } = await loadProfileViaUsername(username);
        if (pageNotExists) {
          setLoading(false);
          return onUserNotExist(username);
        }
        onSetProfileId({ username, profileId: user.id });
        onSetUserState({
          userId: user.id,
          newState: {
            userId: user.id,
            contentId: user.id,
            username,
            ...user,
            loaded: true
          }
        });
        onInitContent({
          contentId: user.id,
          contentType: 'user',
          ...user
        });
        setLoading(false);
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          setTimeout(loadProfile, 500);
        } else {
          onUserNotExist(username);
          setLoading(false);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, notExist, profile.loaded]);

  if (loading) {
    return <Loading />;
  }

  if (pageType === 'watched') {
    return (
      <div>
        <div>watched page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'likes') {
    return (
      <div>
        <div>likes page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'all' && subPageType === 'byuser') {
    return (
      <div>
        <div>made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'all') {
    return (
      <div>
        <div>all posts by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'comments') {
    return (
      <div>
        <div>comments by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'subjects' && subPageType === 'byuser') {
    return (
      <div>
        <div>subjects made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'subjects') {
    return (
      <div>
        <div>subjects by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'ai-stories') {
    return (
      <div>
        <div>ai stories by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'videos' && subPageType === 'byuser') {
    return (
      <div>
        <div>videos made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'videos') {
    return (
      <div>
        <div>videos by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'links' && subPageType === 'byuser') {
    return (
      <div>
        <div>links made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  return (
    <div>
      <div>user page</div>
      <div>{src}</div>
    </div>
  );
}
