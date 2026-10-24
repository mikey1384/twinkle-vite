import { useEffect } from 'react';

// The paper's typefaces, loaded only when the Arena opens: Noto Serif KR for
// the Korean booklet's 명조 and Tinos (metric-compatible with Times New
// Roman) for English papers. Without them each device falls back to its own
// serif. Google Fonts serves CJK in unicode-range slices, so only the glyphs
// a paper uses are downloaded.
const LINK_ID = 'arena-paper-fonts';
const HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap';

// Old Hangul (고전 시가: ᄂᆞᆫ, ᄒᆞ, ᅀ) is cut from Google's Noto Serif KR
// slices, and no common system font composes its jamo, so those syllables
// print as boxes. The full Noto Serif KR (OFL, pinned release) composes
// them; its unicode-range is the archaic jamo only, so the 4.7 MB file is
// fetched only by a paper that prints old Hangul.
const OLD_HANGUL_ID = 'arena-old-hangul-font';
export const OLD_HANGUL_FAMILY = 'Arena Old Hangul';
const OLD_HANGUL_CSS = `@font-face {
  font-family: '${OLD_HANGUL_FAMILY}';
  src: url('https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Serif2.003/Serif/SubsetOTF/KR/NotoSerifKR-Regular.otf') format('opentype');
  unicode-range: U+1100-11FF, U+302E-302F, U+A960-A97F, U+D7B0-D7FF;
  font-display: swap;
}`;

export function useArenaPaperFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.getElementById(LINK_ID)) {
      const link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      link.href = HREF;
      document.head.appendChild(link);
    }
    if (!document.getElementById(OLD_HANGUL_ID)) {
      const style = document.createElement('style');
      style.id = OLD_HANGUL_ID;
      style.textContent = OLD_HANGUL_CSS;
      document.head.appendChild(style);
    }
  }, []);
}
