import { useEffect } from 'react';

// The paper's typefaces, loaded only when the Arena opens: Noto Serif KR for
// the Korean booklet's 명조 and Tinos (metric-compatible with Times New
// Roman) for English papers. Without them each device falls back to its own
// serif. Google Fonts serves CJK in unicode-range slices, so only the glyphs
// a paper uses are downloaded.
const LINK_ID = 'arena-paper-fonts';
const HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap';

export function useArenaPaperFonts() {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(LINK_ID)) {
      return;
    }
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
}
