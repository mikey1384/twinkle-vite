import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

test('shared prompt ContentPanel keeps like status inside the like action wrapper', () => {
  const source = readSource(
    'src/components/ContentPanel/Body/BottomInterface.tsx'
  );

  assert.match(source, /content-panel__shared-topic-like-action/);
  assert.match(
    source,
    /<div className="content-panel__shared-topic-like-action">[\s\S]*<LikeButton[\s\S]*sharedTopicLikeStatusShown[\s\S]*<Likers/
  );
  assert.match(source, /bottomStatsRowShown\s*=\s*[\s\S]*!isSharedTopic/);
  assert.match(source, /{!isSharedTopic && \(\s*<Likers/);
});

test('shared prompt ContentPanel uses paired clone button layout only for its action row', () => {
  const source = readSource(
    'src/components/ContentPanel/Body/BottomInterface.tsx'
  );

  assert.match(source, /content-panel__shared-topic-clone-actions/);
  assert.match(source, /<CloneButtons[\s\S]*layout="paired"/);
});

test('paired CloneButtons layout structurally groups each chat button with its clone button', () => {
  const source = readSource('src/components/Buttons/CloneButtons.tsx');

  assert.match(source, /layout = 'default'/);
  assert.match(source, /layout\?: 'default' \| 'paired'/);
  assert.match(source, /clone-buttons__target-action/);
  assert.match(
    source,
    /function renderPairedTarget[\s\S]*renderChatButton\(target\)[\s\S]*renderCloneButton\(target, hasClone\)/
  );
});

test('other shared prompt surfaces keep the default CloneButtons layout', () => {
  const richTextSharedPromptSource = readSource(
    'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/SharedPromptComponent/index.tsx'
  );
  const sharedPromptCardSource = readSource(
    'src/containers/MissionPage/SystemPromptShared/SharedPromptCard.tsx'
  );

  assert.doesNotMatch(richTextSharedPromptSource, /layout="paired"/);
  assert.doesNotMatch(sharedPromptCardSource, /layout="paired"/);
});
