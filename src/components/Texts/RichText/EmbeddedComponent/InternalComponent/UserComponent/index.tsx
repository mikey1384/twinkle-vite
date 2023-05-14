import React, { useEffect } from 'react';
import { useProfileState, useTheme } from '~/helpers/hooks';

export default function UserComponent({ src }: { src: string }) {
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
        const { pageNotExists, user } = await loadProfileViaUsername(
          params.username
        );
        if (pageNotExists) {
          setLoading(false);
          return onUserNotExist(params.username);
        }
        onSetProfileId({ username: params.username, profileId: user.id });
        onSetUserState({
          userId: user.id,
          newState: {
            userId: user.id,
            contentId: user.id,
            username: params.username,
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
          onUserNotExist(params.username);
          setLoading(false);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username, notExist, profile.loaded]);

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
