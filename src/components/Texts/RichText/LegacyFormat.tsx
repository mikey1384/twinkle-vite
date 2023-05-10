import React, { useMemo } from 'react';
import { limitBrs, processedStringWithURL } from '~/helpers/stringHelpers';
import { Link } from 'react-router-dom';
import parse from 'html-react-parser';

export default function LegacyFormat({
  text,
  fullText,
  isOverflown
}: {
  text: string;
  fullText?: boolean;
  isOverflown?: boolean | null;
}) {
  const processedText = useMemo(() => {
    let processedText = processedStringWithURL(text);
    if (!fullText && processedText && isOverflown) {
      const splitText = processedText?.split('</');
      if (splitText[splitText.length - 1] === 'a>') {
        let finalTextArray = processedText?.split('<a');
        finalTextArray = finalTextArray.filter(
          (_, index) => index !== finalTextArray.length - 1
        );
        processedText = finalTextArray.join('<a');
      }
    }
    const finalText = convertStringToJSX(limitBrs(processedText));
    return finalText;
  }, [fullText, isOverflown, text]);
  return <>{processedText}</>;
}

function convertStringToJSX(text: string): React.ReactNode {
  const result = parse(limitBrs(text), {
    replace: (domNode) => {
      if (
        domNode.type === 'tag' &&
        domNode.name === 'a' &&
        domNode.attribs?.class === 'mention'
      ) {
        const node = domNode.children?.[0];
        return <Link to={domNode.attribs.href || ''}>{node?.data}</Link>;
      }
    }
  });
  return result;
}
