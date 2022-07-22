import React, { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import UserActions from './User/actions';
import UserReducer from './User/reducer';
import requestHelpers from './requestHelpers';
import { ChatContextProvider } from './Chat';
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
import { LAST_ONLINE_FILTER_LABEL } from '~/constants/defaultValues';

export const AppContext = createContext();
export const initialMyState = {
  authLevel: 0,
  canDelete: false,
  canEdit: false,
  canEditRewardLevel: false,
  canReward: false,
  canEditPlaylists: false,
  canPinPlaylists: false,
  hideWatched: false,
  isCreator: false,
  lastChatPath: '',
  numWordsCollected: 0,
  profileTheme: 'logoBlue',
  searchFilter: '',
  userId: null,
  xpThisMonth: null
};

AppContextProvider.propTypes = {
  children: PropTypes.node
};

export function AppContextProvider({ children }) {
  const [userState, userDispatch] = useReducer(UserReducer, {
    myState: initialMyState,
    loadMoreButton: false,
    loaded: false,
    missions: {},
    orderUsersBy: LAST_ONLINE_FILTER_LABEL,
    profiles: [],
    profilesLoaded: false,
    searchedProfiles: [],
    signinModalShown: false,
    userObj: {}
  });
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
                        <AppContext.Provider
                          value={{
                            user: {
                              state: userState,
                              actions: UserActions(userDispatch)
                            },
                            requestHelpers: requestHelpers(handleError)
                          }}
                        >
                          <ChatContextProvider>{children}</ChatContextProvider>
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

  function handleError(error) {
    if (error.response) {
      console.error(error.response);
      const { status } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        userDispatch({
          type: 'LOGOUT_AND_OPEN_SIGNIN_MODAL'
        });
      }
      if (status === 301) {
        window.location.reload();
      }
    }
    return Promise.reject(error?.response || error);
  }
}
