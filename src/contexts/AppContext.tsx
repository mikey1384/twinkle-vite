import React, { useReducer, ReactNode, useCallback, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import UserActions from './User/actions';
import UserReducer from './User/reducer';
import requestHelpers from './requestHelpers';
import { ChatContextProvider } from './Chat';
import { ChessContextProvider } from './Chess';
import { ContentContextProvider } from './Content';
import { ExploreContextProvider } from './Explore';
import { HomeContextProvider } from './Home';
import { InputContextProvider } from './Input';
import { InteractiveContextProvider } from './Interactive';
import { ManagementContextProvider } from './Management';
import { NotiContextProvider } from './Notification';
import { ProfileContextProvider } from './Profile';
import { MissionContextProvider } from './Mission';
import { ViewContextProvider } from './View';
import { DEFAULT_PROFILE_THEME, LAST_ONLINE_FILTER_LABEL } from '~/constants/defaultValues';

export const AppContext = createContext({});
export const initialMyState = {
  achievementPoints: 0,
  level: 1,
  canDelete: false,
  canEdit: false,
  canEditRewardLevel: false,
  canReward: false,
  canEditPlaylists: false,
  canPinPlaylists: false,
  collectType: '',
  hideWatched: false,
  isAdmin: false,
  lastChatPath: '',
  profileTheme: DEFAULT_PROFILE_THEME,
  searchFilter: '',
  userId: null,
  wordleStrictMode: false,
  xpThisMonth: null,
  communityFunds: 0
};

const REDIRECT_RELOAD_STORAGE_KEY = 'twinkleRedirectReloadAt';
const REDIRECT_RELOAD_COOLDOWN_MS = 60 * 1000;

function shouldReloadForRedirect() {
  try {
    if (typeof window === 'undefined') {
      return true;
    }
    if (typeof window.sessionStorage === 'undefined') {
      return true;
    }
    const lastReload =
      Number(window.sessionStorage.getItem(REDIRECT_RELOAD_STORAGE_KEY)) || 0;
    const now = Date.now();
    if (!lastReload || now - lastReload > REDIRECT_RELOAD_COOLDOWN_MS) {
      window.sessionStorage.setItem(
        REDIRECT_RELOAD_STORAGE_KEY,
        String(now)
      );
      return true;
    }
    return false;
  } catch {
    // When storage is unavailable (private mode, quota exceeded, etc.),
    // fall back to the old behavior and reload immediately.
    return true;
  }
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [userState, userDispatch] = useReducer(UserReducer, {
    myState: initialMyState,
    loadMoreButton: false,
    loaded: false,
    missions: {},
    orderUsersBy: LAST_ONLINE_FILTER_LABEL,
    profiles: [],
    profilesLoaded: false,
    profilesVisibleCount: 15,
    searchedProfiles: [],
    signinModalShown: false,
    userObj: {},
    achievementsObj: {},
    achieverObj: {}
  });

  const handleError = useCallback(
    (error: any) => {
      if (error?.response) {
        const { status, data } = error.response;

        if (status === 401) {
          localStorage.removeItem('token');
          userDispatch({
            type: 'LOGOUT_AND_OPEN_SIGNIN_MODAL'
          });
        }

        if (status === 301) {
          if (shouldReloadForRedirect()) {
            window.location.reload();
          } else {
            console.warn('Redirect response detected; reload suppressed to avoid loop.');
          }
        }

        return Promise.reject({
          status,
          message: data?.message || 'An unexpected error occurred'
        });
      }

      return Promise.reject({
        status: 500,
        message: error?.message || 'An unexpected error occurred'
      });
    },
    [userDispatch]
  );

  const memoUserActions = useMemo(() => UserActions(userDispatch), [userDispatch]);
  const memoRequestHelpers = useMemo(
    () => requestHelpers(handleError),
    [handleError]
  );

  const contextValue = useMemo(
    () => ({
      user: {
        state: userState,
        actions: memoUserActions
      },
      requestHelpers: memoRequestHelpers
    }),
    [userState, memoUserActions, memoRequestHelpers]
  );

  return (
    <ManagementContextProvider>
      <ProfileContextProvider>
        <ExploreContextProvider>
          <ViewContextProvider>
            <NotiContextProvider>
              <MissionContextProvider>
                <HomeContextProvider>
                  <InputContextProvider>
                    <ContentContextProvider>
                      <InteractiveContextProvider>
                        <AppContext.Provider value={contextValue}>
                          <ChessContextProvider>
                            <ChatContextProvider>{children}</ChatContextProvider>
                          </ChessContextProvider>
                        </AppContext.Provider>
                      </InteractiveContextProvider>
                    </ContentContextProvider>
                  </InputContextProvider>
                </HomeContextProvider>
              </MissionContextProvider>
            </NotiContextProvider>
          </ViewContextProvider>
        </ExploreContextProvider>
      </ProfileContextProvider>
    </ManagementContextProvider>
  );
}
