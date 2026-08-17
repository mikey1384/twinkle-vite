import React, { useReducer, ReactNode, useCallback, useMemo } from 'react';
import axios from 'axios';
import { createContext } from './selectableContext';
import UserActions from './User/actions';
import UserReducer from './User/reducer';
import requestHelpers from './requestHelpers';
import { BuildContextProvider } from './Build';
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
import {
  DEFAULT_PROFILE_THEME,
  LAST_ONLINE_FILTER_LABEL,
  clientVersion,
  localStorageKeys
} from '~/constants/defaultValues';
import {
  getStoredItem,
  getTwinkleDeviceId,
  hasRejectedAuthSessionMarker,
  removeStoredItem,
  retireRejectedAuthToken,
  setStoredItem
} from '~/helpers/userDataHelpers';
import {
  getErrorMessage,
  getErrorMessageFromResponseData
} from '~/helpers/errorMessageHelpers';
import { clearAnalyticsUser } from '~/helpers/analytics';
import { TWINKLE_CLIENT_REFRESH_REQUIRED_EVENT } from '~/constants/socketEvents';
import URL from '~/constants/URL';
import { createUnauthorizedSessionResolver } from '~/helpers/sessionUnauthorizedGuard';
import { createSessionInterruption } from '~/helpers/sessionInterruption';

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
  buildQuickAccessMode: 'recent',
  buildHeaderCollapsed: false,
  lumineHeaderMinimized: false,
  hideWatched: false,
  isAdmin: false,
  lastChatPath: '',
  profileTheme: DEFAULT_PROFILE_THEME,
  searchFilter: '',
  userId: null,
  wordleStrictMode: false,
  xpThisMonth: null,
  communityFunds: 0,
  communityFundsLoaded: false
};

const initialUserState = {
  myState: initialMyState,
  loadMoreButton: false,
  loaded: false,
  missions: {},
  orderUsersBy: LAST_ONLINE_FILTER_LABEL,
  profiles: [],
  profilesLoaded: false,
  searchedProfiles: [],
  sessionInterruption:
    null as ReturnType<typeof createSessionInterruption> | null,
  signinModalShown: false,
  userObj: {},
  achievementsObj: {},
  achieverObj: {}
};

function createInitialUserState() {
  const sessionInterruption = hasRejectedAuthSessionMarker()
    ? createSessionInterruption('session_token_invalid')
    : null;
  return {
    ...initialUserState,
    sessionInterruption,
    signinModalShown: Boolean(sessionInterruption)
  };
}

const noopDispatch = () => undefined;

function createNoopFunctionShape(source: Record<string, unknown>) {
  return Object.fromEntries(
    Object.keys(source).map((key) => [key, () => undefined])
  );
}

const defaultUserActions = createNoopFunctionShape(UserActions(noopDispatch));
const defaultRequestHelpers = requestHelpers((error) => Promise.reject(error));

const defaultAppContextValue = {
  user: {
    state: initialUserState,
    actions: defaultUserActions
  },
  requestHelpers: defaultRequestHelpers
};

export const AppContext = createContext<any>(defaultAppContextValue);

const REDIRECT_RELOAD_STORAGE_KEY = 'twinkleRedirectReloadAt';
const REDIRECT_RELOAD_COOLDOWN_MS = 60 * 1000;
const SESSION_VALIDATION_TIMEOUT_MS = 15 * 1000;

async function validateInteractiveSessionToken(token: string) {
  try {
    const response = await axios.get(`${URL}/user/session/validate`, {
      headers: {
        authorization: token,
        'x-twinkle-device-id': getTwinkleDeviceId(),
        'x-twinkle-client-version': clientVersion
      },
      timeout: SESSION_VALIDATION_TIMEOUT_MS,
      validateStatus: () => true
    });
    if (response.status === 401) return 'invalid' as const;
    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data?.valid === true
    ) {
      return 'valid' as const;
    }
    return 'unknown' as const;
  } catch {
    return 'unknown' as const;
  }
}

const resolveInvalidSessionToken = createUnauthorizedSessionResolver({
  canonicalSessionUrl: `${URL}/user/session`,
  getCurrentToken: () => getStoredItem('token'),
  validateSessionToken: validateInteractiveSessionToken
});

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
      window.sessionStorage.setItem(REDIRECT_RELOAD_STORAGE_KEY, String(now));
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
  const [userState, userDispatch] = useReducer(
    UserReducer,
    initialUserState,
    createInitialUserState
  );

  const handleError = useCallback(
    async (error: any) => {
      if (error?.response) {
        const { status, data } = error.response;
        const message =
          getErrorMessageFromResponseData(data) ||
          'An unexpected error occurred';

        if (status === 426 || data?.code === 'client_refresh_required') {
          window.dispatchEvent(
            new CustomEvent(TWINKLE_CLIENT_REFRESH_REQUIRED_EVENT)
          );
        }

        // A transport failure has no HTTP response and can never reach this
        // branch. Conversely, an actual 401 is canonical server evidence even
        // when Safari's navigator.onLine hint is stale, so do not let that hint
        // override the session-validation boundary.
        if (status === 401) {
          const invalidSessionToken = await resolveInvalidSessionToken(error);
          if (
            invalidSessionToken &&
            getStoredItem('token') === invalidSessionToken &&
            retireRejectedAuthToken(invalidSessionToken)
          ) {
            // A canonical rejection retires the exact unusable credential and
            // its cached identity. This is deliberately separate from missing
            // or unreadable mobile storage, which remains recoverable.
            Object.keys(localStorageKeys).forEach((key) =>
              removeStoredItem(key)
            );
            setStoredItem('profileTheme', DEFAULT_PROFILE_THEME);
            clearAnalyticsUser();
            userDispatch({
              type: 'SESSION_INTERRUPTED',
              interruption: createSessionInterruption(
                'session_token_invalid'
              )
            });
          }
        }

        if (status === 301) {
          if (shouldReloadForRedirect()) {
            window.location.reload();
          } else {
            console.warn(
              'Redirect response detected; reload suppressed to avoid loop.'
            );
          }
        }

        return Promise.reject({
          status,
          message,
          code: data?.code,
          retryable: data?.retryable,
          retryAfterSeconds:
            Number(data?.retryAfterSeconds) ||
            Number(error.response.headers?.['retry-after']) ||
            undefined,
          requiredVersion: data?.requiredVersion
        });
      }

      return Promise.reject({
        status: 500,
        message: getErrorMessage(error),
        // Preserve whether the server produced an HTTP response. Callers with
        // durable idempotency keys may safely retry an unknown-outcome
        // transport failure, while still treating a real 5xx response as a
        // completed server response with an application-level failure.
        isTransportError: true
      });
    },
    [userDispatch]
  );

  const memoUserActions = useMemo(
    () => UserActions(userDispatch),
    [userDispatch]
  );
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
                          <BuildContextProvider>
                            <ChessContextProvider>
                              <ChatContextProvider>
                                {children}
                              </ChatContextProvider>
                            </ChessContextProvider>
                          </BuildContextProvider>
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
