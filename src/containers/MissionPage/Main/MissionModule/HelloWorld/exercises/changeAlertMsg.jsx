import { ALERT_MSG } from './constants';
import {
  getAstProps,
  filterOpeningElementsByType,
  getElementAttribute
} from '../../helpers';
import {
  stringIsEmpty,
  stringsAreCaseInsensitivelyEqual
} from '~/helpers/stringHelpers';

export const title = `Hello World`;
export const instruction = (
  <>
    Make it so that when you tap the <b>Tap me</b> button you get an alert
    message that says{' '}
    <b>
      <i>{`'${ALERT_MSG}'`}</i>
    </b>
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
  let alertText = '';
  const buttons = filterOpeningElementsByType({
    elements: jsxElements,
    filter: 'button'
  });
  const button = buttons[0];
  const onClickFunc = getElementAttribute({
    openingElement: button,
    attributeName: 'onClick'
  });
  if (onClickFunc?.value?.expression?.body?.callee?.name === 'alert') {
    alertText = onClickFunc?.value?.expression?.body?.arguments?.[0]?.value;
  }
  if (stringsAreCaseInsensitivelyEqual(alertText.trim(), ALERT_MSG)) {
    return await onUpdateMissionStatus();
  }
  if (!button) {
    return onSetErrorMsg(
      <>
        {`Where's`} the <b>button</b>?
      </>
    );
  }
  if (!onClickFunc) {
    return onSetErrorMsg(
      <>
        The button {`doesn't`} have an <b>onClick</b> property. Please check
        your code
      </>
    );
  }
  if (stringIsEmpty(alertText)) {
    return onSetErrorMsg(
      `Hmmm... The alert popup does not seem to have any message in it`
    );
  }
  onSetErrorMsg(
    `The alert message should say, '${ALERT_MSG}', not '${alertText.trim()}'`
  );
}
