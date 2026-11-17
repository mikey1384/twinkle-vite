const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');
const root = path.resolve(__dirname, '../..');
const text = 'They are supposed to match hagwon 레벨 테스트. They are not supposed to be easy';
const subject = { id: 37294, contentId: 37294, contentType: 'subject', userId: 18353, uploader: { id: 18353 }, hasSecretAnswer: true, secretShown: false, loaded: true };
const redacted = { id: 350899, contentId: 350899, contentType: 'comment', subjectId: 37294, rootType: 'subject', rootId: 37294, loaded: true, content: '', secretHidden: true, uploader: { id: 5, username: 'mikey' }, targetObj: { subject }, commentsLoaded: true, likes: [], rewards: [], recommendations: [] };
const canonical = { ...redacted, content: text, targetObj: { subject: { ...subject, secretShown: true } } };
delete canonical.secretHidden; // This is the API's unredacted response shape.
function source(file, base) {
  return base ? execFileSync('git', ['show', `${base}:${file}`], { cwd: root, encoding: 'utf8' }) : readFileSync(path.join(root, file), 'utf8');
}
function compile(file, resolve, base) {
  const mod = { exports: {} };
  const code = transformSync(source(file, base), { loader: file.endsWith('tsx') ? 'tsx' : 'ts', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  return mod.exports;
}
function fixture({ base } = {}) {
  let state = { comment350899: structuredClone(redacted), subject37294: structuredClone(subject) };
  let viewerId = 18933;
  const cache = new Map();
  const noop = () => {};
  const actions = new Proxy({}, { get: () => noop });
  const Color = new Proxy({}, { get: () => () => '#555' });
  const constants = { Color, borderRadius: '8px', mobileMaxWidth: '767px', desktopMinWidth: '768px' };
  const context = React.createContext({ commentsLoadLimit: 5 });
  const blank = () => null;
  const passthrough = ({ children }) => React.createElement(React.Fragment, null, children);
  const modules = {
    react: React,
    'react-sanitized-html': blank,
    '@emotion/css': require('@emotion/css'),
    '~/constants/css': constants,
    '~/constants/defaultValues': { defaultContentState: {}, cardLevelHash: {}, ZERO_TWINKLE_ID: 111, CIEL_TWINKLE_ID: 222 },
    '~/contexts': {
      useKeyContext: fn => fn({ myState: { userId: viewerId, level: 1 }, helpers: { checkUserChange: id => id !== viewerId } }),
      useContentContext: fn => fn({ state, actions }),
      useAppContext: fn => fn({ requestHelpers: actions }),
      useHomeContext: fn => fn({ actions })
    },
    '~/helpers/hooks': {
      useContentState: ({ contentType, contentId }) => ({ uploader: {}, targetObj: {}, ...(state[`${contentType}${contentId}`] || {}) }),
      useMyLevel: () => ({})
    },
    '~/helpers': { determineUserCanRewardThis: () => false, determineXpButtonDisabled: () => true },
    '~/theme/hooks/useRoleColor': { useRoleColor: () => ({ color: '#1672bc', colorKey: 'logoBlue' }) },
    '~/helpers/assistantVoice': { assistantVoiceForUserId: () => undefined },
    '~/helpers/bookEmbedHelpers': { getSubjectDisplayDescription: x => x.description },
    '~/helpers/rewardLevel': { resolveContentRewardLevel: () => 0 },
    '~/helpers/ownerTrace': { measureOwnerLayout: (_label, fn) => fn() },
    '~/helpers/hooks/useSubjectSecretVisibility': noop,
    '~/helpers/homeFeedActionIntent': {},
    '~/contexts/Content/secretVisibilityRequests': {},
    '~/components/ErrorBoundary': passthrough,
    '~/components/Comments/AiEnergySponsorButton': { default: blank, shouldRenderAiEnergySponsorNotice: () => false },
    'react-router-dom': { useNavigate: () => noop, Link: ({ children }) => React.createElement('a', null, children) },
    uuid: { v1: () => 'fixture' }
  };
  const actual = new Set([
    'src/components/ContentPanel/Body/index.tsx',
    'src/components/ContentPanel/Body/MainContent/index.tsx',
    'src/components/ContentPanel/Body/MainContent/ContentDisplay/index.tsx',
    'src/components/ContentPanel/Body/MainContent/ContentDisplay/Content.tsx',
    'src/components/SecretComment.tsx',
    'src/helpers/stringHelpers.tsx',
    'src/helpers/richTextMarkerHelpers.ts',
    'src/helpers/youtubeUrlHelpers.ts',
    'src/helpers/subjectSecretHelpers.ts',
    'src/helpers/contentActionAvailability.ts',
    'src/helpers/dailyTaskRewardDisplay.ts',
    'src/contexts/Content/reducer.ts',
    'src/contexts/Content/spoilerState.ts',
    'src/contexts/Content/idListHelpers.ts',
    'src/helpers/contentPageSeed.ts',
    'src/helpers/liveComments.ts',
    'src/helpers/aiEnergySponsorship.ts'
  ]);
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const value = compile(file, name => {
      if (name in modules) return modules[name];
      if (name.endsWith('/Context')) return context;
      if (name === '~/components/Texts/RichText') {
        // Exercise the exact text passed to the renderer; Markdown parsing is
        // tested separately. Browser layout/async chunks are outside this test.
        return ({ children }) => React.createElement('p', { 'data-rich-text-body': true }, children);
      }
      if (name.startsWith('.') || name.startsWith('~/')) {
        const target = name.startsWith('~/') ? `src/${name.slice(2)}` : path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
        for (const suffix of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
          if (actual.has(target + suffix)) return load(target + suffix);
        }
        return blank;
      }
      return require(name);
    }, base);
    cache.set(file, value);
    return value;
  }
  const reducer = load('src/contexts/Content/reducer.ts').default;
  const Body = load('src/components/ContentPanel/Body/index.tsx').default;
  return {
    load,
    get state() { return state; },
    set state(next) { state = next; },
    setViewer(id) { viewerId = id; },
    dispatch(action) { state = reducer(state, action); },
    unlock() { state = reducer(state, { type: 'CHANGE_SPOILER_STATUS', contentId: subject.id, contentType: 'subject', shown: true, prevSecretViewerId: 18933 }); },
    receive(data = canonical) { state = reducer(state, { type: 'INIT_CONTENT', contentId: 350899, contentType: 'comment', data }); },
    render() { return renderToStaticMarkup(React.createElement(context.Provider, { value: { commentsLoadLimit: 5 } }, React.createElement(Body, { contentObj: state.comment350899, theme: 'logoBlue', onChangeSpoilerStatus: noop }))); }
  };
}
module.exports = { fixture, compile, source, text, redacted, canonical, subject };
