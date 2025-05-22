import React, { useEffect, useState } from 'react';
import { useProfileState } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useProfileContext
} from '~/contexts';
import Loading from '~/components/Loading';
import DefaultComponent from './DefaultComponent';

export default function UserComponent({ src }: { src: string }) {
  const parts = src.split('/');
  const username = parts[2];
  const pageType = parts[3];
  const subPageType = parts[4];
  const [loading, setLoading] = useState(false);
  const { notExist, profileId } = useProfileState(username || '');
  const loadProfileViaUsername = useAppContext(
    (v) => v.requestHelpers.loadProfileViaUsername
  );
  const profile = useAppContext((v) => v.user.state.userObj[profileId] || {});
  const onUserNotExist = useProfileContext((v) => v.actions.onUserNotExist);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetProfileId = useProfileContext((v) => v.actions.onSetProfileId);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);

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
      } catch (_error) {
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
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'likes') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'all' && subPageType === 'byuser') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        subPageType={subPageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'all') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'comments') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'subjects' && subPageType === 'byuser') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        subPageType={subPageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'subjects') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'ai-stories') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'videos' && subPageType === 'byuser') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        subPageType={subPageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'videos') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  if (pageType === 'links' && subPageType === 'byuser') {
    return (
      <DefaultComponent
        src={src}
        pageType={pageType}
        subPageType={subPageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  return <DefaultComponent src={src} profile={profile} profileId={profileId} />;
}
