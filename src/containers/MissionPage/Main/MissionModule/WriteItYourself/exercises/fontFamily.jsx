import {
  getAstProps,
  getElementStyleProps,
  returnStyleErrorMsg,
  filterOpeningElementsByType
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

const HEADING_FONT_FAMILY = 'fantasy';
const HEADING_COLOR = '#4b9be1';
const SUBHEADING_FONT_FAMILY = 'cursive';
const SUBHEADING_COLOR = 'rgb(243, 103, 123)';
const BUTTON_FONT_FAMILY = 'monospace';

export const title = `Change the Font Styles`;
export const instruction = (
  <>
    <div>
      Set the <b>heading</b>
      {`'s`} <b>fontFamily</b> to <b>{`'${HEADING_FONT_FAMILY}'`}</b> and its{' '}
      <b>color</b> to{' '}
      <b style={{ color: HEADING_COLOR }}>{`'${HEADING_COLOR}'`}</b>
    </div>
    <div>
      Set the <b>subheading</b>
      {`'s`} <b>fontFamily</b> to <b>{`'${SUBHEADING_FONT_FAMILY}'`}</b> and its{' '}
      <b>color</b> to{' '}
      <b style={{ color: SUBHEADING_COLOR }}>{`'${SUBHEADING_COLOR}'`}</b>
    </div>
    <div>
      Set <b>both button{`s'`}</b> <b>fontFamily</b> to{' '}
      <b>{`'${BUTTON_FONT_FAMILY}'`}</b>
    </div>
  </>
);
export const initialCode = ({ username }) => `function HomePage() {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <h1>${username}'s website</h1>
      <h2 style={{ marginBottom: '10rem' }}>click the buttons below</h2>
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
      <button
        style={{
          padding: '1rem',
          fontSize: '2rem',
          background: 'orange',
          color: 'white',
          marginTop: '2rem'
        }}
        onClick={() => {
          let name = prompt("What's your name?");
          if (name) {
            alert('Nice to meet you, ' + name + '!');
          } else {
            alert('Nice to meet you, stranger');
          }
        }}
      >
        {"What's your name?"}
      </button>
    </div>
  );
}`;

export async function onRunCode({ ast, onUpdateMissionStatus, onSetErrorMsg }) {
  let headingFontFamily = '';
  let headingColor = '';
  let subheadingFontFamily = '';
  let subheadingColor = '';
  let firstButtonFontFamily = '';
  let secondButtonFontFamily = '';
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXOpeningElement'
  });
  const headingElements = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'h1'
  });
  const headingElement = headingElements[0];
  if (headingElement) {
    const styleProps = getElementStyleProps(headingElement);
    for (let prop of styleProps) {
      const propName = prop?.key?.name;
      const propValue = prop?.value?.value;
      if (propName === 'fontFamily') {
        headingFontFamily = propValue;
      }
      if (propName === 'color') {
        headingColor = propValue;
      }
    }
  }
  const subheadingElements = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'h2'
  });
  const subheadingElement = subheadingElements[0];
  if (subheadingElement) {
    const styleProps = getElementStyleProps(subheadingElement);
    for (let prop of styleProps) {
      const propName = prop?.key?.name;
      const propValue = prop?.value?.value;
      if (propName === 'fontFamily') {
        subheadingFontFamily = propValue;
      }
      if (propName === 'color') {
        subheadingColor = propValue;
      }
    }
  }
  const buttons = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'button'
  });
  const firstButton = buttons[0];
  if (firstButton) {
    const styleProps = getElementStyleProps(firstButton);
    for (let prop of styleProps) {
      const propName = prop?.key?.name;
      const propValue = prop?.value?.value;
      if (propName === 'fontFamily') {
        firstButtonFontFamily = propValue;
      }
    }
  }
  const secondButton = buttons[1];
  if (secondButton) {
    const styleProps = getElementStyleProps(secondButton);
    for (let prop of styleProps) {
      const propName = prop?.key?.name;
      const propValue = prop?.value?.value;
      if (propName === 'fontFamily') {
        secondButtonFontFamily = propValue;
      }
    }
  }

  if (
    stringsAreCaseInsensitivelyEqual(headingFontFamily, HEADING_FONT_FAMILY) &&
    stringsAreCaseInsensitivelyEqual(headingColor, HEADING_COLOR) &&
    stringsAreCaseInsensitivelyEqual(
      subheadingFontFamily,
      SUBHEADING_FONT_FAMILY
    ) &&
    stringsAreCaseInsensitivelyEqual(subheadingColor, SUBHEADING_COLOR) &&
    stringsAreCaseInsensitivelyEqual(
      firstButtonFontFamily,
      BUTTON_FONT_FAMILY
    ) &&
    stringsAreCaseInsensitivelyEqual(secondButtonFontFamily, BUTTON_FONT_FAMILY)
  ) {
    return await onUpdateMissionStatus();
  }
  if (!headingElement) {
    return onSetErrorMsg(
      <>
        {`Don't`} delete the <b>heading</b>
      </>
    );
  }
  if (
    !stringsAreCaseInsensitivelyEqual(headingFontFamily, HEADING_FONT_FAMILY)
  ) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<h1>',
        propName: 'fontFamily',
        correctValue: HEADING_FONT_FAMILY,
        valueEntered: headingFontFamily
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(headingColor, HEADING_COLOR)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<h1>',
        propName: 'color',
        correctValue: HEADING_COLOR,
        valueEntered: headingColor
      })
    );
  }
  if (!subheadingElement) {
    return onSetErrorMsg(
      <>
        {`Don't`} delete the <b>subheading</b>
      </>
    );
  }
  if (
    !stringsAreCaseInsensitivelyEqual(
      subheadingFontFamily,
      SUBHEADING_FONT_FAMILY
    )
  ) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<h2>',
        propName: 'fontFamily',
        correctValue: SUBHEADING_FONT_FAMILY,
        valueEntered: subheadingFontFamily
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(subheadingColor, SUBHEADING_COLOR)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: '<h2>',
        propName: 'color',
        correctValue: SUBHEADING_COLOR,
        valueEntered: subheadingColor
      })
    );
  }
  if (!firstButton) {
    return onSetErrorMsg(
      <>
        {`Don't`} delete the <b>buttons</b>
      </>
    );
  }
  if (
    !stringsAreCaseInsensitivelyEqual(firstButtonFontFamily, BUTTON_FONT_FAMILY)
  ) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'first button',
        propName: 'fontFamily',
        correctValue: BUTTON_FONT_FAMILY,
        valueEntered: firstButtonFontFamily
      })
    );
  }
  if (!secondButton) {
    return onSetErrorMsg(
      <>
        {`Don't`} delete the <b>second button</b>
      </>
    );
  }
  if (
    !stringsAreCaseInsensitivelyEqual(
      secondButtonFontFamily,
      BUTTON_FONT_FAMILY
    )
  ) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'second button',
        propName: 'fontFamily',
        correctValue: BUTTON_FONT_FAMILY,
        valueEntered: secondButtonFontFamily
      })
    );
  }
  onSetErrorMsg(`Something's not right - please check the code`);
}
