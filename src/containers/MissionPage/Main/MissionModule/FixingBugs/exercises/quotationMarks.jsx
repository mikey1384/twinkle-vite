import {
  getAstProps,
  filterElementsByType,
  getElementInnerText,
  getElementStyleProps,
  returnStyleErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

const MARGIN_TOP = '3rem';

export const title = `Remember the 'Quotation Marks'`;
export const instruction = (
  <>
    Can you <b>fix the bug</b> in the code below?
  </>
);
export const initialCode = `function HomePage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontSize: '2rem',
        textAlign: 'center'
      }}
    >
      <div>First</div>
      <div style={{ marginTop: '1rem' }}>Second</div>
      <div style={{ marginTop: ${MARGIN_TOP} }}>Third</div>
    </div>
  );
}`;

export async function onRunCode({ ast, onSetErrorMsg, onUpdateMissionStatus }) {
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXElement'
  });
  let marginTop = '';
  let innerText = '';
  const dividers = filterElementsByType({
    elements: jsxElements,
    filter: 'div'
  });
  for (let divider of dividers) {
    innerText = getElementInnerText(divider);
    if (innerText === 'Third') {
      const styleProps = getElementStyleProps(divider.openingElement);
      for (let prop of styleProps) {
        if (prop?.key?.name === 'marginTop') {
          marginTop = prop?.value?.value;
        }
      }
    }
  }
  if (stringsAreCaseInsensitivelyEqual(marginTop, MARGIN_TOP)) {
    return await onUpdateMissionStatus();
  }
  if (innerText !== 'Third') {
    return onSetErrorMsg(
      <>
        {`Don't`} delete/modify the parts of the code that are not causing the
        bug. Press <b>RESET</b> if needed
      </>
    );
  }
  onSetErrorMsg(
    returnStyleErrorMsg({
      targetName: 'third <div>',
      propName: 'marginTop',
      correctValue: MARGIN_TOP,
      valueEntered: marginTop
    })
  );
}
