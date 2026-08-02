import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAnalyticsCommandGate,
  type AnalyticsCommand
} from '../src/helpers/analyticsCommandGate';

test('holds every analytics command until canonical identity is resolved', () => {
  const dispatched: AnalyticsCommand[] = [];
  const gate = createAnalyticsCommandGate(false);
  const dispatch = (command: AnalyticsCommand) => dispatched.push(command);

  assert.equal(gate.enqueue(['event', 'page_view'], dispatch), false);
  assert.equal(gate.enqueue(['event', 'build_view'], dispatch), false);
  assert.deepEqual(dispatched, []);

  gate.resolve(dispatch);

  assert.deepEqual(dispatched, [
    ['event', 'page_view'],
    ['event', 'build_view']
  ]);
});

test('dispatches immediately after resolution and resolves only once', () => {
  const dispatched: AnalyticsCommand[] = [];
  const gate = createAnalyticsCommandGate(true);
  const dispatch = (command: AnalyticsCommand) => dispatched.push(command);

  assert.equal(gate.enqueue(['event', 'login'], dispatch), true);
  gate.resolve(dispatch);
  gate.resolve(dispatch);

  assert.deepEqual(dispatched, [['event', 'login']]);
});
