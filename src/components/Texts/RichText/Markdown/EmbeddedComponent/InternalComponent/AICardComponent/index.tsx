import React, { useMemo } from 'react';
import SingleCardComponent from './SingleCardComponent';
import MultiCardComponent from './MultiCardComponent';
import DefaultComponent from '../DefaultComponent';

export default function AICardComponent({
  isPreview,
  rootId,
  rootType,
  src
}: {
  isPreview?: boolean;
  src: string;
  rootId?: number | string;
  rootType?: string;
}) {
  const queryParams = useMemo<Record<string, string | null>>(() => {
    const url = new URL(`https:/${src}`);
    const params = new URLSearchParams(url.search || '');
    const cardId = params.get('cardId');
    const color = params.get('search[color]');
    const isBuyNow = params.get('search[isBuyNow]');
    const isMystery = params.get('search[isMystery]');
    const engine = params.get('search[engine]');
    const cardStyle = params.get('search[style]');
    const quality = params.get('search[quality]');
    const owner = params.get('search[owner]');
    const word = params.get('search[word]');
    return {
      cardId,
      color,
      isBuyNow,
      isMystery,
      engine,
      quality,
      cardStyle,
      owner,
      word
    };
  }, [src]);

  if (queryParams.cardId) {
    return (
      <SingleCardComponent
        cardId={Number(queryParams.cardId)}
        isPreview={isPreview}
      />
    );
  }
  if (
    Object.keys(queryParams).filter((key: string) => queryParams[key]).length
  ) {
    return (
      <MultiCardComponent
        {...queryParams}
        isPreview={isPreview}
        rootId={rootId}
        rootType={rootType}
        src={src}
      />
    );
  }
  return (
    <DefaultComponent linkType="ai-cards" src={src} isPreview={isPreview} />
  );
}
