import {
  getAstProps,
  filterOpeningElementsByType,
  getElementStyleProps,
  returnStyleErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

const PADDING = '3rem';
const MARGIN_TOP = '7rem';

export const title = `Margin and Padding`;
export const instruction = (
  <>
    Change the <b>marginTop</b> value of the{' '}
    <b style={{ color: 'blue' }}>Tap me</b> {`button's`} <b>style</b> property
    to <b>{`'${MARGIN_TOP}'`}</b> and the <b>padding</b> value to{' '}
    <b>{`'${PADDING}'`}</b>
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
          color: '#4b9be1',
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          fontSize: '2rem'
        }}
      >
        Welcome to My Website!
      </p>
      <button
        style={{
          marginTop: '0rem',
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
  let marginTop = '';
  let padding = '';
  const buttons = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'button'
  });
  const button = buttons[0];
  const styleProps = getElementStyleProps(button);
  for (let prop of styleProps) {
    if (prop?.key?.name === 'marginTop') {
      marginTop = prop?.value?.value;
    }
    if (prop?.key?.name === 'padding') {
      padding = prop?.value?.value;
    }
  }
  if (
    stringsAreCaseInsensitivelyEqual(marginTop, MARGIN_TOP) &&
    stringsAreCaseInsensitivelyEqual(padding, PADDING)
  ) {
    return await onUpdateMissionStatus();
  }
  if (!button) {
    return onSetErrorMsg('Did you delete the button?');
  }
  if (!stringsAreCaseInsensitivelyEqual(marginTop, MARGIN_TOP)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'button',
        propName: 'marginTop',
        correctValue: MARGIN_TOP,
        valueEntered: marginTop
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(padding, PADDING)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'button',
        propName: 'padding',
        correctValue: PADDING,
        valueEntered: padding
      })
    );
  }
  onSetErrorMsg(`Something's not right - please check the code`);
}
