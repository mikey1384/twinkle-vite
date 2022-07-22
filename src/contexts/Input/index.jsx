import React, { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import InputActions from './actions';
import InputReducer from './reducer';

export const InputContext = createContext();
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
  userInfo: {}
};

InputContextProvider.propTypes = {
  children: PropTypes.node
};
export function InputContextProvider({ children }) {
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
