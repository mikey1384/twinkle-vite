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
import { useParams, useNavigate } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { useThemeTokens } from '~/theme/useThemeTokens';
import { applyThemeVars } from '~/theme';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const loadProfileViaUsername = useAppContext(
    (v) => v.requestHelpers.loadProfileViaUsername
  );
  const setTheme = useAppContext((v) => v.requestHelpers.setTheme);
  const userId = useKeyContext((v) => v.myState.userId);
  const viewerTheme = useKeyContext((v) => v.myState.profileTheme);
  const username = useKeyContext((v) => v.myState.username);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onSetProfileId = useProfileContext((v) => v.actions.onSetProfileId);
  const onUserNotExist = useProfileContext((v) => v.actions.onUserNotExist);
  const [loading, setLoading] = useState(false);
  const { notExist, profileId } = useProfileState(params.username || '');
  const profile = useAppContext((v) => v.user.state.userObj[profileId]) || {};
  const [selectedTheme, setSelectedTheme] = useState(
    profile?.profileTheme || DEFAULT_PROFILE_THEME
  );
  const { themeRoles } = useThemeTokens({
    themeName: selectedTheme
  });
  const backgroundColor = useMemo(() => {
    const role = themeRoles.background;
    const key = role?.color || 'whiteGray';
    const fn = Color[key as keyof typeof Color];
    return fn ? fn() : key;
  }, [themeRoles.background]);

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
    setSelectedTheme(profile?.profileTheme || DEFAULT_PROFILE_THEME);
  }, [
    navigate,
    params.username,
    profile?.profileTheme,
    profile?.unavailable,
    userId,
    username
  ]);

  // Ensure viewing a profile applies that user's theme (even when logged out)
  useEffect(() => {
    if (!profile?.id) return;
    const isViewingOwnProfile = userId ? profile.id === userId : false;
    if (isViewingOwnProfile) {
      // Clear any lingering route override when viewing own profile
      try {
        localStorage.removeItem('routeProfileTheme');
      } catch (_err) {}
      return;
    }
    // Visiting another user's profile: set a route-specific theme override
    try {
      const theme = profile?.profileTheme || DEFAULT_PROFILE_THEME;
      localStorage.setItem('routeProfileTheme', theme);
      // Immediately apply theme variables so page background updates without extra navigation
      applyThemeVars(theme as any);
    } catch (_err) {}
    return () => {
      // Clear override when leaving the profile page
      try {
        localStorage.removeItem('routeProfileTheme');
        // Restore viewer theme variables immediately
        const stored = (localStorage.getItem('profileTheme') ||
          viewerTheme ||
          DEFAULT_PROFILE_THEME) as any;
        const restore = stored as any;
        applyThemeVars(restore);
      } catch (_err) {}
    };
  }, [profile?.id, profile?.profileTheme, userId, viewerTheme]);

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
            background: `var(--page-bg, ${backgroundColor})`
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
