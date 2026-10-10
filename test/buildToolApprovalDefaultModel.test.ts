import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSelectedModelOption } from '../src/containers/Build/Editor/ChatPanel/helpers/toolApprovalModel';

const options = [
  { id: 'gpt-image-2.5-flare', label: 'GPT Image 2.5 Flare' },
  { id: 'gemini-nano-banana-2.1', label: 'Nano Banana 2.1' }
];

test('the image card is one tap: the default is preselected, the kid can still change it', () => {
  assert.equal(
    resolveSelectedModelOption({
      modelOptions: options,
      defaultModelId: 'gemini-nano-banana-2.1'
    })?.id,
    'gemini-nano-banana-2.1'
  );
  assert.equal(
    resolveSelectedModelOption({
      modelOptions: options,
      pickedModelId: 'gpt-image-2.5-flare',
      defaultModelId: 'gemini-nano-banana-2.1'
    })?.id,
    'gpt-image-2.5-flare'
  );
  // Approvals stored before the default existed fall back to the first option.
  assert.equal(
    resolveSelectedModelOption({ modelOptions: options })?.id,
    'gpt-image-2.5-flare'
  );
  assert.equal(
    resolveSelectedModelOption({
      modelOptions: options,
      defaultModelId: 'retired-model'
    })?.id,
    'gpt-image-2.5-flare'
  );
  assert.equal(resolveSelectedModelOption({ modelOptions: [] }), undefined);
});
