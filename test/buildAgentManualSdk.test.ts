import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildAgentManualText } from '../src/containers/Build/PreviewPanel/AgentManualPane';
import { AGENT_MANUAL_SDK } from '../src/containers/Build/PreviewPanel/agentManualSdk.generated';

// The Agent manual's platform rules and SDK reference come from twinkle-api's
// constants/buildSdkManifest.json through scripts/generate-build-sdk-index.mjs,
// so an agent working in the website editor reads the same SDK as Lumine and
// Lumine CLI agents. The hand-written copy this replaces had fallen 17
// namespaces behind (11-22).
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATED = path.join(
  HERE,
  '..',
  'src',
  'containers',
  'Build',
  'PreviewPanel',
  'agentManualSdk.generated.ts'
);
const API = path.join(HERE, '..', '..', 'twinkle-api');
const MANIFEST = path.join(API, 'constants', 'buildSdkManifest.json');
const GENERATOR_LIB = path.join(API, 'scripts', 'lib', 'agentManualSdk.mjs');

test('the generated Agent manual SDK section matches the SDK manifest', async (t) => {
  if (!fs.existsSync(MANIFEST) || !fs.existsSync(GENERATOR_LIB)) {
    return t.skip('twinkle-api is not beside this repository');
  }
  const { renderAgentManualSdkModule } = await import(
    pathToFileURL(GENERATOR_LIB).href
  );
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  assert.equal(
    fs.readFileSync(GENERATED, 'utf8'),
    renderAgentManualSdkModule(manifest),
    'agentManualSdk.generated.ts is stale: run node twinkle-api/scripts/generate-build-sdk-index.mjs'
  );
});

test('the copied manual lists every SDK namespace and method', () => {
  const manual = buildAgentManualText(null);
  assert.ok(AGENT_MANUAL_SDK.namespaces.length >= 40);
  for (const namespace of AGENT_MANUAL_SDK.namespaces) {
    assert.ok(
      manual.includes(`### ${namespace.name}\n`),
      `${namespace.name} is missing from the manual`
    );
    assert.ok(namespace.methods.length > 0, `${namespace.name} has no methods`);
    for (const method of namespace.methods) {
      assert.ok(
        manual.includes(`- ${method.call}`),
        `${method.call} is missing from the manual`
      );
    }
  }
  assert.ok(manual.includes(`Build SDK ${AGENT_MANUAL_SDK.version}`));
});

test('the manual carries the namespaces the hand-written copy had lost', () => {
  const manual = buildAgentManualText(null);
  for (const call of [
    'Twinkle.social.setJoinable(',
    'Twinkle.social.onVisitor(',
    'Twinkle.social.reportTogether(',
    'Twinkle.app.lifecycle.onSuspend(',
    'Twinkle.app.history.push(',
    'Twinkle.app.getShareUrl(',
    'Twinkle.rewards.claim(',
    'Twinkle.coins.charge(',
    'Twinkle.land.edit(',
    'Twinkle.arena.',
    'Twinkle.craft.merge(',
    'Twinkle.cardCraft.craft(',
    'Twinkle.town.',
    'Twinkle.soundtracks.getSong(',
    'Twinkle.audio.muted',
    'Twinkle.media.capturePhoto(',
    'Twinkle.live.start(',
    'Twinkle.network.',
    'Twinkle.appTools.register(',
    'Twinkle.wordMaster.',
    'Twinkle.sharedDb.kv.set('
  ]) {
    assert.ok(manual.includes(call), `${call} is missing from the manual`);
  }
});

test('the manual leads with the platform rules and essential SDK features', () => {
  const manual = buildAgentManualText(null);
  const rules = manual.indexOf('## Platform Rules');
  const essentials = manual.indexOf('## Essential SDK Features');
  const reference = manual.indexOf('## SDK Reference');
  assert.ok(rules > 0 && rules < essentials && essentials < reference);
  assert.ok(AGENT_MANUAL_SDK.platformRules.rules.length >= 17);
  AGENT_MANUAL_SDK.platformRules.rules.forEach((rule, index) => {
    assert.ok(manual.includes(`${index + 1}. ${rule}`));
  });
  for (const item of AGENT_MANUAL_SDK.essentialSdk.items) {
    assert.ok(manual.includes(`When: ${item.when} Use: ${item.use}`));
  }
  assert.match(manual, /data-twinkle-document/);
  assert.match(manual, /confirm\(\) always returns false/);
  assert.match(manual, /### Meeting other members \(Twinkle\.social\)/);
  assert.match(manual, /### AI decision design/);
});

test('the manual no longer repeats claims the SDK dropped', () => {
  const manual = buildAgentManualText(null);
  // Download links to uploaded files do nothing inside the frame (platform
  // rule new-windows); Grammarbles answers are checked on the server.
  assert.doesNotMatch(manual, /<a href=\{imageUrl\} download/);
  assert.doesNotMatch(manual, /questions and answers by level/);
  assert.doesNotMatch(manual, /Twinkle\.preview\.wrapResult/);
});
