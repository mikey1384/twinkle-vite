import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatProviderName,
  inferProviderFromModel
} from '../src/containers/Management/AiCosts/helpers/formatters';

test('management AI costs recognizes and formats xAI models', () => {
  assert.equal(inferProviderFromModel('grok-4.6'), 'xai');
  assert.equal(inferProviderFromModel('grok-4.5'), 'xai');
  assert.equal(formatProviderName('xai'), 'xAI');
  assert.equal(formatProviderName('unknown', { model: 'grok-4.6' }), 'xAI');
});
