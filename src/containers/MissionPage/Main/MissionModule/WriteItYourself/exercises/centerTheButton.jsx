import React from 'react';
import {
  getAstProps,
  filterElementsByType,
  getElementStyleProps,
  returnStyleErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

const WIDTH = '100%';
const DISPLAY = 'flex';
const JUSTIFY_CONTENT = 'center';

export const title = `Center the Button`;
export const instruction = (
  <>
    <div>
      Surround the <b style={{ color: 'blue' }}>button</b> with a pair of{' '}
      <b>{`<div></div>`}</b> tags.
    </div>
    <div>
      Set the <b>width</b> value of the <b>{`<div>`}</b>
      {`'s`} style property to <b>{`'${WIDTH}'`}</b>,
    </div>
    <div>
      its <b>display</b> value to <b>{`'${DISPLAY}'`}</b> and{' '}
      <b>justifyContent</b> value to <b>{`'${JUSTIFY_CONTENT}'`}</b>
    </div>
  </>
);
export const initialCode = `function HomePage() {
  return (
    <button
      style={{
        padding: '1rem',
        fontSize: '2rem',
        background: 'blue',
        color: 'white'
      }}
      onClick={() => alert('Hello there')}
    >
      Welcome
    </button>
  );
}`;

export async function onRunCode({ ast, onUpdateMissionStatus, onSetErrorMsg }) {
  let divWidth = '';
  let divDisplay = '';
  let divJustifyContent = '';
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXElement'
  });
  const divElements = filterElementsByType({
    elements: jsxElements,
    filter: 'div'
  });
  const divElement = divElements[0];
  if (divElement) {
    const styleProps = getElementStyleProps(divElement.openingElement);
    for (let prop of styleProps) {
      const propName = prop?.key?.name;
      const propValue = prop?.value?.value;
      if (propName === 'width') {
        divWidth = propValue;
      }
      if (propName === 'display') {
        divDisplay = propValue;
      }
      if (propName === 'justifyContent') {
        divJustifyContent = propValue;
      }
    }
  }
  if (
    stringsAreCaseInsensitivelyEqual(divWidth, WIDTH) &&
    stringsAreCaseInsensitivelyEqual(divDisplay, DISPLAY) &&
    stringsAreCaseInsensitivelyEqual(divJustifyContent, JUSTIFY_CONTENT)
  ) {
    return await onUpdateMissionStatus();
  }
  if (!divElement) {
    return onSetErrorMsg(
      <>
        {`Where's`} the <b>{`<div></div>`}</b> pair?
      </>
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(divWidth, WIDTH)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<div>',
        propName: 'width',
        correctValue: WIDTH,
        valueEntered: divWidth
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(divDisplay, DISPLAY)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<div>',
        propName: 'display',
        correctValue: DISPLAY,
        valueEntered: divDisplay
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(divJustifyContent, JUSTIFY_CONTENT)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<div>',
        propName: 'justifyContent',
        correctValue: JUSTIFY_CONTENT,
        valueEntered: divJustifyContent
      })
    );
  }
  onSetErrorMsg(`Something's not right - please check the code`);
}
