import assert from 'node:assert/strict';
import test from 'node:test';
import { readBuildRuntimeAiStream } from '../src/contexts/requestHelpers/buildRuntimeAiStream';

function buildNdjsonResponse(events: unknown[]) {
  return new Response(events.map((event) => JSON.stringify(event)).join('\n'));
}

test('Build runtime AI streams return only a canonical done event', async () => {
  const observed: unknown[] = [];
  const result = await readBuildRuntimeAiStream({
    response: buildNdjsonResponse([
      { type: 'status', status: 'thinking' },
      { type: 'text', delta: '{"value":' },
      { type: 'done', object: { value: 1 } }
    ]),
    onEvent: (event) => observed.push(event)
  });

  assert.deepEqual(result, { type: 'done', object: { value: 1 } });
  assert.equal(observed.length, 3);
});

test('Build runtime AI streams reject a clean EOF without canonical completion', async () => {
  await assert.rejects(
    readBuildRuntimeAiStream({
      response: buildNdjsonResponse([
        { type: 'status', status: 'thinking' },
        { type: 'text', delta: '{"value":' }
      ])
    }),
    (error: any) => {
      assert.equal(error.code, 'build_ai_stream_incomplete');
      assert.match(error.message, /before a final result/i);
      return true;
    }
  );
});
