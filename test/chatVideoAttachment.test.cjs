const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');
const ts = require('typescript');

const read = file => readFileSync(path.resolve(__dirname, '../src', file), 'utf8');
const base = 'containers/Chat/Message/MessageBody/TextMessage/VideoAttachment/';
function compile(source, dependencies = {}) {
  const mod = { exports: {} };
  const code = transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', code)(name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}
const youtube = compile(read('helpers/youtubeUrlHelpers.ts'));
// Compile the actual self-contained Twinkle URL extractor without importing
// unrelated app contexts from the larger string-helper module.
const helperSource = ts.createSourceFile('stringHelpers.tsx', read('helpers/stringHelpers.tsx'), ts.ScriptTarget.Latest, true);
const extractor = helperSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'extractVideoIdFromTwinkleVideoUrl');
assert.ok(extractor);
const twinkle = compile(extractor.getText(helperSource));
const useContentState = ({ contentType, contentId }) => contentType === 'chat'
  ? { currentTime: 42 }
  : { loaded: contentId !== 333, notFound: contentId === 999, title: 'Sample title', content: 'slYfiSb5AX4', rewardLevel: 4 };
const dependencies = {
  react: React,
  '@emotion/css': require('@emotion/css'),
  '~/constants/css': { Color: new Proxy({}, { get: () => () => '#334155' }), mobileMaxWidth: '767px' },
  '~/helpers': { isMobile: () => false },
  '~/helpers/hooks': { useContentState },
  '~/contexts': { useContentContext: selector => selector({ actions: { onSetVideoCurrentTime() {}, onSetMediaStarted() {}, onInitContent() {} } }), useAppContext: selector => selector({ requestHelpers: { loadContent() {} } }), useKeyContext: selector => selector({ myState: { userId: 5 } }) },
  '~/components/Icon': () => null,
  '~/components/ErrorBoundary': ({ children }) => children,
  '~/components/VideoPlayer': props => React.createElement('div', { 'data-player': 'youtube', 'data-width': props.width, 'data-height': props.height, 'data-resume': props.initialTime, 'data-src': props.src }),
  './TwinkleVideo': props => React.createElement('div', { 'data-player': 'twinkle', 'data-id': props.videoId }),
  '~/helpers/stringHelpers': { isValidYoutubeUrl: youtube.isYouTubeVideoUrl, fetchedVideoCodeFromURL: youtube.getYouTubeVideoId, ...twinkle }
};
const VideoAttachment = compile(read(`${base}index.tsx`), dependencies).default;
const render = props => renderToStaticMarkup(React.createElement(VideoAttachment, { messageId: 20, ...props }));

test('direct YouTube uses a fluid aspect-ratio frame and retains its resume position', () => {
  const markup = render({ extractedUrl: 'https://www.youtube.com/watch?v=slYfiSb5AX4' });
  assert.match(markup, /data-chat-video-frame/);
  assert.match(markup, /data-width="100%" data-height="100%" data-resume="42"/);
  assert.match(markup, /data-src="slYfiSb5AX4"/);
});

test('hide attachment remains permission-gated and is a labeled native button', () => {
  const props = { extractedUrl: 'https://youtu.be/slYfiSb5AX4', onHideAttachment() {} };
  assert.doesNotMatch(render(props), /Hide video attachment/);
  assert.doesNotMatch(render({ ...props, userCanEditThis: true, onHideAttachment: undefined }), /Hide video attachment/);
  assert.match(render({ ...props, userCanEditThis: true }), /<button type="button" aria-label="Hide video attachment"/);
});

test('Twinkle IDs, missing videos and unsupported links take their intended paths', () => {
  assert.match(render({ extractedUrl: 'https://www.twin-kle.com/videos/244' }), /data-player="twinkle" data-id="244"/);
  assert.equal(render({ extractedUrl: 'https://www.twin-kle.com/videos/999' }), '');
  assert.equal(render({ extractedUrl: 'https://example.com/not-a-video' }), '');
});

test('Twinkle player uses the available width and lets rewards determine its height', () => {
  const Component = compile(read(`${base}TwinkleVideo/index.tsx`), {
    ...dependencies,
    '~/components/Loading': props => React.createElement('div', { 'data-loading': true, style: props.style }),
    '~/components/XPVideoPlayer': props => React.createElement('div', { 'data-xp-player': true, style: props.style }),
    './Link': () => null
  }).default;
  const props = { videoId: 244, messageId: 20, title: 'Sample', onPlay() {}, style: { width: '100%' } };
  const markup = renderToStaticMarkup(React.createElement(Component, props));
  assert.match(markup, /data-xp-player="true" style="width:100%;min-width:0"/);
  const loading = renderToStaticMarkup(React.createElement(Component, { ...props, videoId: 333 }));
  assert.match(loading, /data-loading="true" style="width:100%;aspect-ratio:16 \/ 9"/);
});

test('phone Twinkle thumbnail is keyboard-accessible and its icon is decorative', () => {
  const Component = compile(read(`${base}TwinkleVideo/Link.tsx`), {
    ...dependencies, '~/assets/YoutubeIcon.svg': 'youtube.svg',
    '../../../RewardAmountInfo': () => null, '../../../RewardLevelInfo': () => null,
    '../../../TwinkleVideoModal': () => null, '~/components/XPVideoPlayer/XPBar': () => null
  }).default;
  const markup = renderToStaticMarkup(React.createElement(Component, { title: 'Sample title', videoCode: 'slYfiSb5AX4', rewardLevel: 0, videoId: 244, messageId: 20 }));
  assert.match(markup, /<button type="button" aria-label="Watch video: Sample title"/);
  assert.match(markup, /<img alt=""/);
});
