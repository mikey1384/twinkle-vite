// The API's word mask stays regex-safe for website clients predating the shared
// display getters. The website presents all hidden fields as ???.
export const TOTAL_MYSTERY_HIDDEN_WORD = '•••';

function isUnrevealedTotalMystery(card: any) {
  if (!card || Number(card.isBurned) === 1) return false;
  const imagePath =
    typeof card.imagePath === 'string' ? card.imagePath.trim() : '';
  const hasRevealedImage =
    !!imagePath && !/^generating\.{0,3}$/i.test(imagePath);
  // The sentinel also covers cards loaded before the total-mystery flag was
  // included in a projection. Streaming previews do not complete a reveal.
  return (
    card.quality === '???' ||
    (Number(card.isTotalMystery) === 1 && !hasRevealedImage)
  );
}

export function getAICardDisplayWord(card: any): string {
  return isUnrevealedTotalMystery(card) ? '???' : card?.word || '';
}

export function getAICardDisplayPrompt(card: any): string {
  return isUnrevealedTotalMystery(card) ? '???' : card?.prompt || '';
}

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
