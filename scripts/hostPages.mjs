// Link-preview crawlers (Facebook, X, Slack, KakaoTalk...) never run our
// JavaScript, so each brand needs its own static HTML for its share tags.
// The hostPages plugin in vite.config.ts emits the built index.html as
// twinkle.html plus this lumine.html copy with Lumine's tags, title, icon and
// manifest; vercel.json sends each host to its page. The build has no
// index.html on purpose: Vercel serves a real file before any rewrite, so "/"
// would otherwise always get Twinkle's tags on lumine.network.
const START = /<!-- share-meta:start[^>]*-->/;
const END = '<!-- share-meta:end -->';

const LUMINE_TITLE = 'Lumine';
const LUMINE_DESCRIPTION =
  'Build apps and games with AI, and play what others make.';
const LUMINE_IMAGE = 'https://www.lumine.network/og-image-lumine.png';

export function buildLumineHtml(html) {
  const start = html.search(START);
  const end = html.indexOf(END);
  if (start < 0 || end < start) {
    throw new Error('share-meta markers are missing from index.html');
  }
  const meta = [
    `<meta name="description" content="${LUMINE_DESCRIPTION}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${LUMINE_TITLE}" />`,
    `<meta property="og:title" content="${LUMINE_TITLE}" />`,
    `<meta property="og:description" content="${LUMINE_DESCRIPTION}" />`,
    `<meta property="og:image" content="${LUMINE_IMAGE}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${LUMINE_TITLE}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${LUMINE_TITLE}" />`,
    `<meta name="twitter:description" content="${LUMINE_DESCRIPTION}" />`,
    `<meta name="twitter:image" content="${LUMINE_IMAGE}" />`
  ].join('\n    ');
  const swapped =
    html.slice(0, start) + meta + html.slice(end + END.length);
  return swapped
    .replace(/<title>[^<]*<\/title>/, `<title>${LUMINE_TITLE}</title>`)
    .replace(
      /<link rel="icon" href="\/favicon\.png" \/>/,
      '<link rel="icon" type="image/svg+xml" href="/lumine-favicon.svg" />'
    )
    .replace(
      /<link rel="manifest" href="\/manifest\.json" \/>/,
      '<link rel="manifest" href="/lumine-manifest.json" />'
    );
}
