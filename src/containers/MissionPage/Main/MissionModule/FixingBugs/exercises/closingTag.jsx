import {
  getAstProps,
  filterElementsByType,
  getElementStyleProps,
  returnStyleErrorMsg
} from '../../helpers';
import { stringsAreCaseInsensitivelyEqual } from '~/helpers/stringHelpers';

const THIRD_MARGIN_TOP = '2rem';
const FOURTH_MARGIN_TOP = '2rem';

export const title = `All <Tags> Must Be </Closed>`;
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
      <div>All tags</div>
      <div>${`{'That Were Opened <div>'}`}</div>
      <div style={{ marginTop: '${THIRD_MARGIN_TOP}' }}>Must</div>
      <div style={{ marginTop: '${FOURTH_MARGIN_TOP}' }}>${`{'Be Closed </div>'}`}</div>
    <div>
  );
}`;

export async function onRunCode({ ast, onSetErrorMsg, onUpdateMissionStatus }) {
  const jsxElements = getAstProps({
    ast,
    propType: 'JSXElement'
  });
  let thirdMarginTop = '';
  let fourthMarginTop = '';
  const dividers = filterElementsByType({
    elements: jsxElements,
    filter: 'div'
  });
  for (let divider of dividers) {
    const JSXChildren = divider.children.filter(
      (child) => child.type === 'JSXElement'
    );
    const thirdChild = JSXChildren?.[2];
    if (thirdChild) {
      const thirdChildStyleProps = getElementStyleProps(
        thirdChild.openingElement
      );
      for (let prop of thirdChildStyleProps) {
        if (prop?.key?.name === 'marginTop') {
          thirdMarginTop = prop?.value?.value;
        }
      }
    }
    const fourthChild = JSXChildren?.[3];
    if (fourthChild) {
      const fourthChildStyleProps = getElementStyleProps(
        fourthChild.openingElement
      );
      for (let prop of fourthChildStyleProps) {
        if (prop?.key?.name === 'marginTop') {
          fourthMarginTop = prop?.value?.value;
        }
      }
    }
  }
  if (
    stringsAreCaseInsensitivelyEqual(thirdMarginTop, THIRD_MARGIN_TOP) &&
    stringsAreCaseInsensitivelyEqual(fourthMarginTop, FOURTH_MARGIN_TOP)
  ) {
    return await onUpdateMissionStatus();
  }
  if (!stringsAreCaseInsensitivelyEqual(thirdMarginTop, THIRD_MARGIN_TOP)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'third <div>',
        propName: 'marginTop',
        correctValue: THIRD_MARGIN_TOP,
        valueEntered: thirdMarginTop
      })
    );
  }
  if (!stringsAreCaseInsensitivelyEqual(fourthMarginTop, FOURTH_MARGIN_TOP)) {
    return onSetErrorMsg(
      returnStyleErrorMsg({
        targetName: 'fourth <div>',
        propName: 'marginTop',
        correctValue: FOURTH_MARGIN_TOP,
        valueEntered: fourthMarginTop
      })
    );
  }
  onSetErrorMsg(`Something's not right - please check the code`);
}
