import React from 'react';
import { Color } from '~/constants/css';
import {
  getAstProps,
  filterOpeningElementsByType,
  getElementStyleProps,
  returnStyleErrorMsg
} from '../../helpers';

export const title = `Make It Blue`;
export const instruction = (
  <>
    Change the color of the <b style={{ color: 'red' }}>{`'red'`}</b> button
    below to <b style={{ color: 'blue' }}>{`'blue'`}</b> and tap the{' '}
    <b style={{ color: Color.green() }}>check</b> button
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
          background: 'red',
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
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXOpeningElement'
  });
  let buttonColor = '';
  const buttonElements = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'button'
  });
  const button = buttonElements[0];
  if (button) {
    const styleProps = getElementStyleProps(button);
    for (let prop of styleProps) {
      if (
        prop?.key?.name === 'background' ||
        prop?.key?.name === 'backgroundColor'
      ) {
        buttonColor = prop?.value?.value;
        break;
      }
    }
  }
  if (
    buttonColor.toLowerCase() === 'blue' ||
    buttonColor.toLowerCase() === '#0000ff' ||
    buttonColor === 'rgb(0, 0, 255)' ||
    buttonColor === 'RGB(0, 0, 255)'
  ) {
    return await onUpdateMissionStatus();
  }
  onSetErrorMsg(
    returnStyleErrorMsg({
      targetName: 'button',
      propName: 'background',
      correctValue: 'blue',
      valueEntered: buttonColor
    })
  );
}
