import React, { useMemo } from 'react';
import SingleCardComponent from './SingleCardComponent';
import MultiCardComponent from './MultiCardComponent';
import DefaultComponent from '../DefaultComponent';

export default function AICardComponent({
  rootId,
  rootType,
  src
}: {
  src: string;
  rootId?: number;
  rootType?: string;
}) {
  const queryParams = useMemo<Record<string, string | null>>(() => {
    const url = new URL(`https:/${src}`);
    const params = new URLSearchParams(url.search || '');
    const cardId = params.get('cardId');
    const color = params.get('search[color]');
    const isBuyNow = params.get('search[isBuyNow]');
    const quality = params.get('search[quality]');
    const owner = params.get('search[owner]');
    const word = params.get('search[word]');
    return { cardId, color, isBuyNow, quality, owner, word };
  }, [src]);

  if (queryParams.cardId) {
    return <SingleCardComponent cardId={Number(queryParams.cardId)} />;
  }
  if (
    Object.keys(queryParams).filter((key: string) => queryParams[key]).length
  ) {
    return (
      <MultiCardComponent
        {...queryParams}
        rootId={rootId}
        rootType={rootType}
        src={src}
      />
    );
  }
  return <DefaultComponent linkType="ai-cards" src={src} />;
}
