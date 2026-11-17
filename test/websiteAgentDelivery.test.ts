import test from 'node:test';
import assert from 'node:assert/strict';
import { WebsiteAgentDelivery } from '../src/helpers/websiteAgentDelivery';
import {
  beginWebsiteAgentDelivery,
  markWebsiteAgentAction,
  websiteAgentRequestHeaders,
  trackWebsiteAgentRequest,
  finishWebsiteAgentDelivery
} from '../src/helpers/websiteAgentAction';

test('duplicate delivery during and after execution submits once and replays its answer', async () => {
  const delivery = new WebsiteAgentDelivery();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let clicks = 0;
  let claims = 0;
  const answers: unknown[] = [];
  const action = {
    id: 'one',
    expiresAt: Date.now() + 10_000,
    claim: async () => {
      claims++;
      return 'token';
    },
    execute: async () => {
      clicks++;
      await gate;
      return { saved: true };
    },
    respond: (result: unknown) => {
      answers.push(result);
    }
  };
  const first = delivery.run(action);
  const duplicate = delivery.run(action);
  release();
  await Promise.all([first, duplicate]);
  await delivery.run(action);
  assert.equal(clicks, 1);
  assert.equal(claims, 1);
  assert.deepEqual(answers, [{ saved: true }, { saved: true }]);
});

test('lost claims, expired leases and a different tab never execute', async () => {
  const delivery = new WebsiteAgentDelivery();
  let clicks = 0;
  for (const [id, expiresAt, token] of [
    ['lost', Date.now() + 1000, null],
    ['expired', 0, 'token']
  ] as const) {
    await delivery.run({
      id,
      expiresAt,
      claim: async () => token,
      execute: async () => clicks++,
      respond: () => {}
    });
  }
  assert.equal(clicks, 0);
});

test('different actions are serialized so request attribution cannot overlap', async () => {
  const delivery = new WebsiteAgentDelivery();
  let active = 0;
  await Promise.all(
    ['a', 'b'].map((id) =>
      delivery.run({
        id,
        expiresAt: Date.now() + 1000,
        claim: async () => 'token',
        execute: async () => {
          assert.equal(active++, 0);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active--;
        },
        respond: () => {}
      })
    )
  );
});

test('only an active delivery marks writes and waits for submitted requests', async () => {
  assert.deepEqual(websiteAgentRequestHeaders(), {});
  beginWebsiteAgentDelivery('action', 'claim');
  markWebsiteAgentAction();
  const first = websiteAgentRequestHeaders();
  const second = websiteAgentRequestHeaders();
  assert.equal(first['x-twinkle-agent-action-id'], 'action');
  assert.equal(first['x-twinkle-agent-claim'], 'claim');
  assert.notEqual(
    first['x-twinkle-agent-request-id'],
    second['x-twinkle-agent-request-id']
  );
  let release!: () => void;
  trackWebsiteAgentRequest(
    new Promise<void>((resolve) => {
      release = resolve;
    })
  );
  let finished = false;
  const finishing = finishWebsiteAgentDelivery().then(() => {
    finished = true;
  });
  await Promise.resolve();
  assert.equal(finished, false);
  release();
  await finishing;
  assert.deepEqual(websiteAgentRequestHeaders(), {});
});
