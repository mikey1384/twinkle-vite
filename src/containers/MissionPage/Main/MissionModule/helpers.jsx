export function getAstProps({ ast, propType }) {
  const results = [];
  for (let key in ast) {
    _getAstProps({ astProp: ast[key], propType });
  }

  function _getAstProps({ astProp, propType }) {
    if (astProp && typeof astProp === 'object') {
      if (
        (!propType && astProp?.type) ||
        (!!propType && astProp?.type === propType)
      ) {
        results.push(astProp);
      }
      for (let key in astProp) {
        _getAstProps({ astProp: astProp[key], propType });
      }
    }
  }
  return results;
}

export function filterElementsByType({ elements, filter }) {
  const results = [];
  for (let element of elements) {
    if (element.openingElement.name.name === filter) {
      results.push(element);
    }
  }
  return results;
}

export function filterOpeningElementsByType({ elements, filter }) {
  const results = [];
  for (let element of elements) {
    if (element?.name?.name === filter) {
      results.push(element);
    }
  }
  return results;
}

export function getElementAttribute({ openingElement, attributeName }) {
  if (openingElement?.attributes?.length > 0) {
    for (let attribute of openingElement.attributes) {
      if (attribute?.name?.name === attributeName) {
        return attribute;
      }
    }
  }
  return null;
}

export function getElementStyleProps(openingElement) {
  const style = getElementAttribute({
    openingElement,
    attributeName: 'style'
  });
  const styleProps = style?.value?.expression?.properties || [];
  return styleProps;
}

export function getElementInnerText(element) {
  for (let child of element?.children || []) {
    if (child.type === 'JSXText') {
      return child.value.trim();
    }
  }
  return '';
}

export function returnInnerTextErrorMsg({
  targetName,
  correctValue,
  valueEntered
}) {
  let errorMsg;
  if (!valueEntered) {
    errorMsg = (
      <>
        <b>{targetName}</b> is empty. Please write{' '}
        <b>
          <i>{correctValue}</i>
        </b>{' '}
        inside <b>{targetName}</b>
      </>
    );
  } else {
    errorMsg = (
      <>
        The text inside <b>{targetName}</b> needs to be{' '}
        <b>
          <i>{correctValue}</i>
        </b>{' '}
        not{' '}
        <b>
          <i>{valueEntered}</i>
        </b>
      </>
    );
  }
  return errorMsg;
}

export function returnStyleErrorMsg({
  targetName,
  propName,
  correctValue,
  valueEntered
}) {
  let errorMsg;
  if (!valueEntered) {
    errorMsg = (
      <>
        Please set the <b>{propName}</b> value of the <b>{targetName}</b>
        {`'s`} <b>style</b> property to{' '}
        <b>
          {typeof correctValue === 'string'
            ? `'${correctValue}'`
            : correctValue}
        </b>
      </>
    );
  } else {
    errorMsg = (
      <>
        The <b>{propName}</b> value of the <b>{targetName}</b>
        {`'s`} <b>style</b> property must be{' '}
        <b>
          {typeof correctValue === 'string'
            ? `'${correctValue}'`
            : correctValue}
        </b>
        {valueEntered ? `, not ${valueEntered}` : ''}
      </>
    );
  }
  return errorMsg;
}
