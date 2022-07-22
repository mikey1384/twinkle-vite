import React from 'react';
import { WELCOME_MSG } from './constants';
import {
  getAstProps,
  filterOpeningElementsByType,
  getElementStyleProps,
  returnStyleErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

const FONT_SIZE = '2rem';
const FONT_WEIGHT = 'bold';
export const title = `Make the Text Bigger and Thicker`;
export const instruction = (
  <>
    Change the <b>fontWeight</b> of your welcome message,{' '}
    <b>{`<p>${WELCOME_MSG}</p>`}</b>, from <b>{`'normal'`}</b> to{' '}
    <b>{`'bold'`}</b> and increase its <b>fontSize</b> to{' '}
    <b>{`'${FONT_SIZE}'`}</b>. You may change its color to any color your want
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
      <p
        style={{
          color: 'black',
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontSize: '1rem'
        }}
      >
        Welcome to My Website!
      </p>
      <button
        style={{
          padding: '1rem',
          color: 'white',
          background: 'blue',
          border: 'none',
          fontSize: '2rem',
          cursor: 'pointer'
        }}
        onClick={() => alert('Hello World')}
      >
        Tap me
      </button>
    </div>
  );
}`;

export async function onRunCode({ ast, onSetErrorMsg, onUpdateMissionStatus }) {
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXOpeningElement'
  });
  let fontSize = '';
  let fontWeight = '';
  const paragraphs = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'p'
  });
  const paragraph = paragraphs[0];
  const styleProps = getElementStyleProps(paragraph);
  for (let prop of styleProps) {
    if (prop?.key?.name === 'fontSize') {
      fontSize = prop?.value?.value;
    }
    if (prop?.key?.name === 'fontWeight') {
      fontWeight = prop?.value?.value;
    }
  }
  if (
    stringsAreCaseInsensitivelyEqual(fontSize, FONT_SIZE) &&
    stringsAreCaseInsensitivelyEqual(fontWeight, FONT_WEIGHT)
  ) {
    return await onUpdateMissionStatus();
  }
  if (!paragraph) {
    return onSetErrorMsg(`Did you delete your welcome message?`);
  }
  if (!stringsAreCaseInsensitivelyEqual(fontSize, FONT_SIZE)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<p>',
        propName: 'fontSize',
        correctValue: FONT_SIZE,
        valueEntered: fontSize
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(fontWeight, FONT_WEIGHT)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<p>',
        propName: 'fontWeight',
        correctValue: FONT_WEIGHT,
        valueEntered: fontWeight
      })
    );
  }
  onSetErrorMsg(`Something's not right - please check the code`);
}
