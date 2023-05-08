import React, { useMemo } from 'react';
import {
  limitBrs,
  processMentionLink,
  processedStringWithURL
} from '~/helpers/stringHelpers';

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
        processedText = finalTextArray.join('<a') + '...';
      }
    }
    const finalText = processMentionLink(limitBrs(processedText));
    return finalText;
  }, [fullText, isOverflown, text]);

  return <>{processedText}</>;
}
