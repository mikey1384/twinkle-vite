import React from 'react';
import { Color } from '~/constants/css';
import { BUTTON_LABEL } from './constants';
import {
  filterElementsByType,
  getElementInnerText,
  getAstProps,
  returnInnerTextErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

export const title = `Tap Me`;
export const instruction = (
  <>
    Change the label of the <b style={{ color: 'blue' }}>button</b> from{' '}
    <b>
      <i>Change me</i>
    </b>{' '}
    to{' '}
    <b>
      <i>{BUTTON_LABEL}</i>
    </b>{' '}
    and tap the <b style={{ color: Color.green() }}>check</b> button
  </>
);
export const initialCode = `function HomePage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <button
        style={{
          padding: '1rem',
          color: 'white',
          background: 'blue',
          border: 'none',
          fontSize: '2rem',
          cursor: 'pointer'
        }}
        onClick={() => alert('I am a button')}
      >
        Change me
      </button>
    </div>
  );
}`;

export async function onRunCode({ ast, onUpdateMissionStatus, onSetErrorMsg }) {
  let buttonText = '';
  const jsxElements = getAstProps({ ast, propType: 'JSXElement' });
  const buttonElements = filterElementsByType({
    elements: jsxElements,
    filter: 'button'
  });
  const button = buttonElements[0];
  buttonText = getElementInnerText(button);
  if (stringsAreCaseInsensitivelyEqual(buttonText, BUTTON_LABEL)) {
    return await onUpdateMissionStatus();
  }
  if (!button) {
    return onSetErrorMsg(
      <>
        {`Where's`} the <b>button</b>?
      </>
    );
  }
  onSetErrorMsg(
    returnInnerTextErrorMsg({
      targetName: '<button></button>',
      correctValue: BUTTON_LABEL,
      valueEntered: buttonText
    })
  );
}
