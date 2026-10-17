import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCrewAskText,
  isCrewAskSend
} from '../src/containers/Chat/CrewChat/crewAsk';

// Telemetry: a message sent from the Ask button's fill counts as a button
// call only while it still starts with the filled-in mention.
test('a send from the Ask fill is marked only while it starts with the mention', () => {
  const filledText = buildCrewAskText({
    assistant: 'Ciel',
    stepNumber: 2,
    stepLabel: 'Meet up'
  });
  // stages are named, never numbered
  assert.match(filledText, /We're on "Meet up"/);
  assert.doesNotMatch(filledText, /step 2/);
  assert.equal(isCrewAskSend({ filledText, content: filledText }), true);
  assert.equal(
    isCrewAskSend({ filledText, content: '@Ciel who should we invite?' }),
    true
  );
  assert.equal(
    isCrewAskSend({ filledText, content: 'can you help @Ciel' }),
    false
  );
  assert.equal(isCrewAskSend({ filledText, content: '@Zero help' }), false);
  assert.equal(isCrewAskSend({ filledText, content: '@Cielo hi' }), false);
  assert.equal(
    isCrewAskSend({ filledText: 'hello', content: '@Ciel help' }),
    false
  );
});
