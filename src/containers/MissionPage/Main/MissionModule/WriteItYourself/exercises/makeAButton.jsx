import {
  getAstProps,
  filterElementsByType,
  getElementAttribute,
  getElementStyleProps,
  getElementInnerText,
  returnInnerTextErrorMsg,
  returnStyleErrorMsg
} from '../../helpers';
import {
  stringIsEmpty,
  stringsAreCaseInsensitivelyEqual
} from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';

const BUTTON_LABEL = 'Welcome';
const FONT_SIZE = '2rem';
const PADDING = '1rem';
const ALERT_TEXT = 'Hello there';

export const title = `Make a Button`;
export const instruction = (
  <>
    <div>
      Make a <b style={{ color: 'blue' }}>blue</b> button with <b>white</b> text
      that says{' '}
      <b>
        <i>{`${BUTTON_LABEL}`}</i>
      </b>
    </div>
    <div>
      Give the button a <b>padding</b> of <b>{`'${PADDING}'`}</b> and set its{' '}
      <b>fontSize</b> value to <b>{`'${FONT_SIZE}'`}</b>
    </div>
    <div>
      Make it so that when you tap/click the button you get a popup saying{' '}
      <b>
        <i>{`'${ALERT_TEXT}'`}</i>
      </b>
    </div>
    <div style={{ marginTop: '2rem' }}>
      <button
        style={{
          color: 'white',
          background: 'blue',
          padding: PADDING,
          fontSize: FONT_SIZE
        }}
        onClick={() => alert('Hello there')}
      >
        {BUTTON_LABEL}
      </button>
    </div>
    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', lineHeight: 1.5 }}>
      <div style={{ marginTop: '1rem' }}>
        <Icon icon="arrow-up" /> This
      </div>
      <div>is what your button should look like. Try tapping/clicking it</div>
    </div>
  </>
);
export const initialCode = `function HomePage() {
  return ();
}`;

export async function onRunCode({ ast, onUpdateMissionStatus, onSetErrorMsg }) {
  let buttonColor = '';
  let buttonTextColor = '';
  let buttonText = '';
  let buttonPadding = '';
  let alertText = '';
  let fontSize = '';
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXElement'
  });
  const buttonElements = filterElementsByType({
    elements: jsxElements,
    filter: 'button'
  });
  const button = buttonElements[0];
  let onClickFunc = null;
  if (button) {
    const styleProps = getElementStyleProps(button.openingElement);
    for (let prop of styleProps) {
      const propName = prop?.key?.name;
      const propValue = prop?.value?.value;
      if (propName === 'background' || propName === 'backgroundColor') {
        buttonColor = propValue;
      }
      if (propName === 'color') {
        buttonTextColor = propValue;
      }
      if (propName === 'padding') {
        buttonPadding = propValue;
      }
      if (propName === 'fontSize') {
        fontSize = propValue;
      }
    }
    buttonText = getElementInnerText(button);
    onClickFunc = getElementAttribute({
      openingElement: button.openingElement,
      attributeName: 'onClick'
    });
    if (onClickFunc?.value?.expression?.body?.callee?.name === 'alert') {
      alertText = onClickFunc?.value?.expression?.body?.arguments?.[0]?.value;
    }
  }
  const buttonIsBlue =
    stringsAreCaseInsensitivelyEqual(buttonColor, 'blue') ||
    stringsAreCaseInsensitivelyEqual(buttonColor, '#0000ff') ||
    stringsAreCaseInsensitivelyEqual(buttonColor, 'rgb(0, 0, 255)');
  const buttonTextColorIsWhite =
    stringsAreCaseInsensitivelyEqual(buttonTextColor, 'white') ||
    stringsAreCaseInsensitivelyEqual(buttonTextColor, '#fff') ||
    stringsAreCaseInsensitivelyEqual(buttonTextColor, '#ffffff') ||
    stringsAreCaseInsensitivelyEqual(buttonTextColor, 'rgb(255, 255, 255)');
  const buttonTextMatches = stringsAreCaseInsensitivelyEqual(
    buttonText,
    BUTTON_LABEL
  );
  const buttonPaddingMatches = stringsAreCaseInsensitivelyEqual(
    buttonPadding,
    PADDING
  );
  const fontSizeMatches = stringsAreCaseInsensitivelyEqual(fontSize, FONT_SIZE);
  const alertTextMatches = stringsAreCaseInsensitivelyEqual(
    alertText.trim(),
    ALERT_TEXT
  );

  if (
    buttonIsBlue &&
    buttonTextColorIsWhite &&
    buttonTextMatches &&
    buttonPaddingMatches &&
    fontSizeMatches &&
    alertTextMatches
  ) {
    return await onUpdateMissionStatus();
  }
  if (!button) {
    return onSetErrorMsg(`Where's the button?`);
  }
  if (!buttonTextMatches) {
    return onSetErrorMsg(
      returnInnerTextErrorMsg({
        targetName: '<button></button>',
        correctValue: BUTTON_LABEL,
        valueEntered: buttonText
      })
    );
  }
  if (!buttonIsBlue) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'button',
        propName: 'background',
        correctValue: 'blue',
        valueEntered: buttonColor
      })
    );
  }
  if (!buttonTextColorIsWhite) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'button',
        propName: 'color',
        correctValue: 'white',
        valueEntered: buttonTextColor
      })
    );
  }
  if (!buttonPaddingMatches) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'button',
        propName: 'padding',
        correctValue: PADDING,
        valueEntered: buttonPadding
      })
    );
  }
  if (!fontSizeMatches) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'button',
        propName: 'fontSize',
        correctValue: FONT_SIZE,
        valueEntered: fontSize
      })
    );
  }
  if (!onClickFunc) {
    return onSetErrorMsg(
      <>
        Right now the button {`doesn't`} do anything when you click it. Add an{' '}
        <b>onClick</b> property containing the function:{' '}
        <b>{`() => alert('${ALERT_TEXT}')`}</b>
      </>
    );
  }
  if (onClickFunc?.value?.expression?.body?.callee?.name !== 'alert') {
    return onSetErrorMsg(
      `The alert function is missing. Please check the code`
    );
  }
  if (stringIsEmpty(alertText)) {
    return onSetErrorMsg(
      `Hmmm... The alert popup does not seem to have any message in it`
    );
  }
  if (!alertTextMatches) {
    return onSetErrorMsg(
      `The alert message should say, '${ALERT_TEXT}', not '${alertText.trim()}'`
    );
  }
  onSetErrorMsg(`Something's not right - please check the code`);
}
