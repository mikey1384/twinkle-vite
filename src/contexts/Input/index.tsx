import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import InputActions from './actions';
import InputReducer from './reducer';

export const InputContext = createContext({});
export const initialInputState = {
  subject: {
    descriptionFieldShown: false,
    details: {
      title: '',
      description: '',
      secretAnswer: '',
      rewardLevel: 0,
      thumbnail: ''
    },
    hasSecretAnswer: false
  },
  content: {
    alreadyPosted: false,
    descriptionFieldShown: false,
    form: {
      url: '',
      isVideo: false,
      title: '',
      description: '',
      rewardLevel: 0
    },
    titleFieldShown: false,
    urlHelper: '',
    urlError: '',
    ytDetails: null
  },
  userInfo: {},
  userSearchText: '',
  playlistSearchText: ''
};

export function InputContextProvider({ children }: { children: ReactNode }) {
  const [inputState, inputDispatch] = useReducer(
    InputReducer,
    initialInputState
  );
  return (
    <InputContext.Provider
      value={{
        state: inputState,
        actions: InputActions(inputDispatch)
      }}
    >
      {children}
    </InputContext.Provider>
  );
}
