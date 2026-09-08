import React, { useEffect, useState } from 'react';
import { useProfileState } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useProfileContext
} from '~/contexts';
import Loading from '~/components/Loading';
import DefaultComponent from './DefaultComponent';
import EmbedLoadError from '../../EmbedLoadError';
import InvalidContent from '../../InvalidContent';

export default function UserComponent({
  src,
  isPreview,
  isChat = false
}: {
  src: string;
  isPreview?: boolean;
  isChat?: boolean;
}) {
  const parts = src.split(/[?#]/)[0].split('/');
  const username = parts[2];
  const pageType = parts[3];
  const subPageType = parts[4];
  const [requestState, setRequestState] = useState<{
    username: string;
    status: 'loading' | 'ready' | 'error';
  } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const { notExist, profileId } = useProfileState(username || '');
  const loadProfileViaUsername = useAppContext(
    (v) => v.requestHelpers.loadProfileViaUsername
  );
  const profile = useAppContext((v) => v.user.state.userObj[profileId]) || {};
  const onUserNotExist = useProfileContext((v) => v.actions.onUserNotExist);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetProfileId = useProfileContext((v) => v.actions.onSetProfileId);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    const maxRetries = 3;

    if (username && !notExist && !profile.loaded) {
      loadProfile();
    }

    async function loadProfile() {
      setRequestState({ username, status: 'loading' });
      try {
        const { pageNotExists, user } = await loadProfileViaUsername(username);
        if (cancelled) return;
        if (pageNotExists) {
          setRequestState({ username, status: 'ready' });
          return onUserNotExist(username);
        }
        if (!Number.isSafeInteger(Number(user?.id)) || Number(user.id) <= 0) {
          throw new Error('Profile response is incomplete');
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
        setRequestState({ username, status: 'ready' });
      } catch (_error) {
        if (cancelled) return;
        if (retries < maxRetries) {
          retries++;
          retryTimer = setTimeout(loadProfile, 500);
        } else {
          // A transport error is not evidence that this username is missing.
          setRequestState({ username, status: 'error' });
        }
      }
    }

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [
    username, notExist, profile.loaded, retryAttempt, loadProfileViaUsername,
    onUserNotExist, onSetProfileId, onSetUserState, onInitContent
  ]);

  if (!username || notExist) return <InvalidContent />;
  if (!profile.loaded) {
    if (requestState?.username === username && requestState.status === 'error') {
      return <EmbedLoadError onRetry={() => setRetryAttempt(value => value + 1)} />;
    }
    return <Loading text="Loading profile" innerStyle={{ fontSize: '14px' }} />;
  }

  if (isChat) {
    return (
      <DefaultComponent
        isChat
        isPreview={isPreview}
        src={src}
        pageType={pageType}
        subPageType={subPageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }

  if (pageType === 'watched') {
    return (
      <DefaultComponent
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
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
        isPreview={isPreview}
        src={src}
        pageType={pageType}
        subPageType={subPageType}
        profile={profile}
        profileId={profileId}
      />
    );
  }
  return (
    <DefaultComponent
      isPreview={isPreview}
      src={src}
      profile={profile}
      profileId={profileId}
    />
  );
}
