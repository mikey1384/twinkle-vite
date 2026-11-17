const assert = require('node:assert/strict');
const test = require('node:test');
const { fixture, text, canonical, compile, source } = require('./helpers/blankCommentFixture.cjs');

test('comment 350899: unlocking keeps the redacted body gated until canonical content arrives', () => {
  const app = fixture({ base: process.env.BLANK_COMMENT_BASE });
  assert.match(app.render(), /Submit your response/);
  app.unlock();
  assert.equal(app.state.comment350899.content, '');
  assert.match(app.render(), /Submit your response/);
  app.receive();
  assert.equal(app.state.comment350899.secretHidden, false);
  assert.ok(app.render().includes(text));
  assert.doesNotMatch(app.render(), /Submit your response/);
});

test('full unredacted comment renders the exact mixed-language body for Extremed and the owner', () => {
  const app = fixture();
  app.unlock();
  app.receive();
  for (const viewerId of [18933, 5]) {
    app.setViewer(viewerId);
    assert.ok(app.render().includes(text));
  }
});

test('a full cached body still stays hidden until the subject is canonically unlocked', () => {
  const app = fixture();
  app.receive(canonical);
  assert.match(app.render(), /Submit your response/);
  assert.ok(!app.render().includes(text));
  app.unlock();
  assert.ok(app.render().includes(text));
});

test('an unlock reload cannot overwrite a newer comment snapshot or its redaction status', () => {
  const app = fixture({ base: process.env.BLANK_COMMENT_BASE });
  app.unlock();
  app.receive({ ...canonical, content: 'Newer edited body', secretHidden: false, liveObservedAt: 200 });
  app.dispatch({
    type: 'INIT_CONTENT', contentId: 350899, contentType: 'comment',
    requestStartedAt: 100,
    data: { ...canonical, content: '', secretHidden: true, liveObservedAt: 100 }
  });
  assert.equal(app.state.comment350899.content, 'Newer edited body');
  assert.equal(app.state.comment350899.secretHidden, false);
  assert.equal(app.state.comment350899.liveObservedAt, 200);
  app.dispatch({
    type: 'INIT_CONTENT', contentId: 350899, contentType: 'comment',
    requestStartedAt: 300,
    data: { ...canonical, liveObservedAt: 300 }
  });
  assert.equal(app.state.comment350899.content, text);
  assert.equal(app.state.comment350899.secretHidden, false);
});

test('comment reads carry their request start through delayed responses', async () => {
  let finish;
  let clock = 100;
  const helpers = compile('src/contexts/requestHelpers/content.ts', name => {
    if (name === './axiosInstance') return { get: () => new Promise(resolve => { finish = resolve; }) };
    if (name === '~/helpers/liveComments') return { getLiveObservedAt: () => clock };
    return {};
  }).default({ auth: () => ({}), handleError: error => { throw error; } });
  const pending = helpers.loadContent({ contentId: 350899, contentType: 'comment' });
  clock = 200;
  finish({ data: canonical });
  assert.deepEqual(await pending, { ...canonical, requestStartedAt: 100 });
});

test('comment page seeds and live thread snapshots retain redaction, then clear it on canonical refresh', () => {
  const modules = {};
  function load(file) {
    return modules[file] ||= compile(file, name => {
      if (name === '~/helpers/aiEnergySponsorship') return load('src/helpers/aiEnergySponsorship.ts');
      if (name === '~/helpers/liveComments') return load('src/helpers/liveComments.ts');
      throw new Error(name);
    });
  }
  const { extractLiveCommentFields } = load('src/helpers/liveComments.ts');
  const { mergeLiveCommentState } = load('src/helpers/aiEnergySponsorship.ts');
  const { buildCommentContentPageSeed } = load('src/helpers/contentPageSeed.ts');
  const locked = { ...canonical, content: '', secretHidden: true, timeStamp: 1793581320 };
  assert.equal(buildCommentContentPageSeed(locked).secretHidden, true);
  assert.equal(extractLiveCommentFields(locked).secretHidden, true);
  const refreshed = mergeLiveCommentState(locked, extractLiveCommentFields(canonical));
  assert.equal(refreshed.secretHidden, false);
  assert.equal(refreshed.content, text);
  assert.deepEqual(extractLiveCommentFields({ filePath: 'attachment' }), { filePath: 'attachment' });
});

test('all redacted comment surfaces use the shared canonical recovery path', () => {
  assert.match(source('src/components/ContentPanel/index.tsx'), /useRefreshUnlockedComment\(contentType === 'comment' \? contentState : null\)/);
  assert.match(source('src/helpers/hooks/useLiveComment.ts'), /useRefreshUnlockedComment\(liveComment\)/);
  for (const file of ['Comment.tsx', 'PinnedComment/Comment.tsx', 'Searched/Comment.tsx']) {
    const text = source(`src/components/Comments/Container/${file}`);
    assert.match(text, /useLiveComment\(props.comment\)/);
    assert.match(text, /Boolean\(comment.secretHidden\)/);
  }
});


test('the reported mixed English/Korean text survives the Markdown and text-effect pipeline', async () => {
  const [{ unified }, { default: remarkParse }, { default: remarkGfm },
    { default: remarkRehype }, { default: rehypeStringify }] = await Promise.all([
    import('unified'), import('remark-parse'), import('remark-gfm'),
    import('remark-rehype'), import('rehype-stringify')
  ]);
  const { prepareMarkdownText } = compile(
    'src/components/Texts/RichText/Markdown/helpers/index.ts',
    name => { throw new Error(name); }
  );
  const { applyTextEffects, applyTextSize } = fixture().load('src/helpers/stringHelpers.tsx');
  const html = unified().use(remarkParse).use(remarkGfm).use(remarkRehype)
    .use(rehypeStringify).processSync(prepareMarkdownText(text, {})).toString();
  assert.equal(applyTextSize(applyTextEffects({ string: html })), `<p>${text}</p>`);
});
