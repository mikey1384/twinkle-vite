export function getAICardDisplayEngine(card: any) {
  if (!card) return '';
  const imagePath =
    typeof card.imagePath === 'string' ? card.imagePath.trim() : '';
  const hasRevealedImage =
    !!imagePath && !/^generating\.{0,3}$/i.test(imagePath);
  const isUnrevealedMystery =
    Number(card.isBurned) !== 1 &&
    (card.isMysteryCard === true || !hasRevealedImage);
  if (isUnrevealedMystery) return '';
  // Cards created before engine attribution was persisted used DALL-E 2.
  return card.engine || 'DALL-E 2';
}
