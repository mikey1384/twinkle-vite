import React, { useEffect, useMemo, useState } from 'react';
import Cover from './Cover';
import Body from './Body';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { Global } from '@emotion/react';
import {
  useAppContext,
  useContentContext,
  useProfileContext,
  useKeyContext
} from '~/contexts';
import { useProfileState } from '~/helpers/hooks';
import { returnTheme } from '~/helpers';
import { useParams, useNavigate } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const loadProfileViaUsername = useAppContext(
    (v) => v.requestHelpers.loadProfileViaUsername
  );
  const setTheme = useAppContext((v) => v.requestHelpers.setTheme);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onSetProfileId = useProfileContext((v) => v.actions.onSetProfileId);
  const onUserNotExist = useProfileContext((v) => v.actions.onUserNotExist);
  const [loading, setLoading] = useState(false);
  const { notExist, profileId } = useProfileState(params.username || '');
  const profile = useAppContext((v) => v.user.state.userObj[profileId]) || {};
  const [selectedTheme, setSelectedTheme] = useState(
    profile?.profileTheme || 'logoBlue'
  );
  const {
    background: { color: backgroundColor }
  } = useMemo(() => returnTheme(selectedTheme), [selectedTheme]);

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
      } catch (error: any) {
        console.error(error);
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

  useEffect(() => {
    if (params.username === 'undefined' && userId && profile?.unavailable) {
      navigate(`/${username}`);
    }
    setSelectedTheme(profile?.profileTheme || 'logoBlue');
  }, [
    navigate,
    params.username,
    profile?.profileTheme,
    profile?.unavailable,
    userId,
    username
  ]);

  return (
    <ErrorBoundary componentPath="Profile/index" style={{ minHeight: '10rem' }}>
      {!notExist ? (
        <>
          {loading && (
            <Loading style={{ marginTop: '5rem' }} text="Loading Profile..." />
          )}
          {!loading && profile.id && (
            <div
              className={css`
                a {
                  white-space: pre-wrap;
                  overflow-wrap: break-word;
                  word-break: break-word;
                }
              `}
              style={{
                position: 'relative'
              }}
            >
              <Cover
                profile={profile}
                onSelectTheme={(theme) => {
                  setSelectedTheme(theme);
                }}
                selectedTheme={selectedTheme}
                onSetTheme={handleSetTheme}
              />
              <Body profile={profile} selectedTheme={selectedTheme} />
            </div>
          )}
        </>
      ) : (
        <InvalidPage
          title={!userId ? 'For Registered Users Only' : ''}
          text={!userId ? 'Please Log In or Sign Up' : ''}
        />
      )}
      <Global
        styles={{
          body: {
            background: Color[backgroundColor]()
          }
        }}
      />
    </ErrorBoundary>
  );

  async function handleSetTheme() {
    await setTheme({ color: selectedTheme });
    onSetUserState({ userId, newState: { profileTheme: selectedTheme } });
    localStorage.setItem('profileTheme', selectedTheme);
  }
}
