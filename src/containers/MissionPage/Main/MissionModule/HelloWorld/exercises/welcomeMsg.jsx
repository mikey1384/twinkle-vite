import React from 'react';
import { WELCOME_MSG } from './constants';
import {
  getAstProps,
  filterElementsByType,
  returnInnerTextErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

export const title = `Welcome Your Visitors`;
export const instruction = (
  <>
    Type a message that says{' '}
    <b>
      <i>{WELCOME_MSG}</i>
    </b>{' '}
    between <b>{`<p>`}</b> and <b>{`</p>`}</b>
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
      <p></p>
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
    propType: 'JSXElement'
  });
  let welcomeText = '';
  const paragraphs = filterElementsByType({
    elements: jsxElements,
    filter: 'p'
  });
  for (let paragraph of paragraphs) {
    for (let child of paragraph?.children) {
      welcomeText = child?.value || '';
    }
  }
  if (stringsAreCaseInsensitivelyEqual(welcomeText.trim(), WELCOME_MSG)) {
    return await onUpdateMissionStatus();
  }
  if (paragraphs.length === 0) {
    return onSetErrorMsg(
      <>
        {`Don't`} delete the <b>{`<p></p>`}</b> tags
      </>
    );
  }
  if (
    stringsAreCaseInsensitivelyEqual(
      welcomeText.trim(),
      WELCOME_MSG.slice(0, -1)
    )
  ) {
    return onSetErrorMsg(
      `You forgot to add an exclamation mark (!) at the end`
    );
  }
  onSetErrorMsg(
    returnInnerTextErrorMsg({
      targetName: '<p></p>',
      correctValue: WELCOME_MSG,
      valueEntered: welcomeText
    })
  );
}
