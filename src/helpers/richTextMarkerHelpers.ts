export function stripTextSizeMarkers(string: string): string {
  const textSizeMarkerRegex = /([hbst])\[([^\n]*?)\]\1/gi;
  let outputString = String(string || '');
  let previousString = '';

  while (outputString !== previousString) {
    previousString = outputString;
    outputString = outputString.replace(textSizeMarkerRegex, '$2');
  }

  return outputString;
}

export function stripTextColorMarkers(string: string): string {
  // color effects use `code|text|code` (e.g. b|hi|b, lb|hi|lb, pf|hi|pf)
  const colorMarkerRegex = /(gr|lb|pf|pu|b|g|l|o|p|r|y)\|([^|\n]+?)\|\1/gi;
  let outputString = String(string || '');
  let previousString = '';

  while (outputString !== previousString) {
    previousString = outputString;
    outputString = outputString.replace(colorMarkerRegex, '$2');
  }

  return outputString;
}

export function stripTwinkleTextMarkers(string: string): string {
  return stripTextColorMarkers(stripTextSizeMarkers(string)).replace(
    /__([^_\n]+?)__/g,
    '$1'
  );
}
