import React, { useMemo } from 'react';

export default function AICardComponent({ src }: { src: string }) {
  const queryParams = useMemo(() => {
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

  return (
    <div>
      <div>AI Card!!</div>
      <div>{src}</div>
      <div>{JSON.stringify(queryParams)}</div>
    </div>
  );
}
