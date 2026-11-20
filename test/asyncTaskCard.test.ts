import test from 'node:test';
import assert from 'node:assert/strict';
import { describeAsyncTaskCard } from '../src/helpers/asyncTaskCard';

test('task status comes from server state rather than treating every approved step as done', () => {
  assert.equal(describeAsyncTaskCard({ status: 'approved' }), undefined);
  assert.equal(
    describeAsyncTaskCard({
      status: 'approved',
      asyncTask: { state: 'active' }
    }),
    'Task saved. The next step will appear here.'
  );
  assert.equal(
    describeAsyncTaskCard({
      status: 'pending',
      asyncTask: { state: 'approval' }
    }),
    'Waiting for your approval.'
  );
  assert.equal(
    describeAsyncTaskCard({
      status: 'processing',
      asyncTask: { state: 'dispatching' }
    }),
    'Working on this step. You can leave the chat.'
  );
  assert.equal(
    describeAsyncTaskCard({
      status: 'approved',
      asyncTask: { state: 'completed' }
    }),
    'Task complete.'
  );
  assert.equal(
    describeAsyncTaskCard({
      status: 'declined',
      asyncTask: { state: 'cancelled' }
    }),
    'Remaining steps stopped.'
  );
  assert.match(
    describeAsyncTaskCard({
      status: 'failed',
      asyncTask: { state: 'needs_review' }
    })!,
    /fresh look/
  );
});

test('late HTTP and socket results do not replace a newer canonical card revision', async () => {
  const { newestAsyncTaskCard } = await import('../src/helpers/asyncTaskCard');
  const { updateChannelMessageSettings } =
    await import('../src/helpers/chatReplyTargetSettings');
  const current = {
    id: 'next-card',
    status: 'pending',
    asyncTask: { id: 'task', stateRevision: 8 }
  };
  const late = {
    id: 'previous-card',
    status: 'approved',
    asyncTask: { id: 'task', stateRevision: 6 }
  };
  assert.equal(newestAsyncTaskCard(current, late), current);
  assert.equal(newestAsyncTaskCard(late, current), current);
  const channel = {
    messagesObj: {
      20: { id: 20, settings: { websiteAgentCard: current } },
      21: {
        id: 21,
        targetMessage: { id: 20, settings: { websiteAgentCard: current } }
      }
    }
  };
  const updated = updateChannelMessageSettings(channel, 20, {
    websiteAgentCard: late
  });
  assert.equal(updated.messagesObj[20].settings.websiteAgentCard, current);
  assert.equal(
    updated.messagesObj[21].targetMessage.settings.websiteAgentCard,
    current
  );
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AsyncActionPreview from '../src/containers/Chat/Message/MessageBody/AsyncActionPreview';

test('step previews show bound picture settings, replacement pictures and the exact app version', () => {
  const ref = { operation: 'step', payloadHash: 'hash' };
  const render = (
    path: string,
    body: object,
    method = 'POST',
    asyncTask: typeof ref & Record<string, unknown> = ref
  ) =>
    renderToStaticMarkup(
      React.createElement(AsyncActionPreview, {
        card: { path, method, body, asyncTask },
        imageBase: 'https://images.example'
      })
    );
  const image = render('/content/image/ai', {
    prompt: 'Two blue moons',
    quality: 'high',
    model: 'gpt-image-2'
  });
  for (const word of [
    'Make this picture',
    'Two blue moons',
    'high',
    'gpt-image-2'
  ])
    assert.ok(image.includes(word));
  const collection = render(
    '/content/image/ai/collections/41',
    { images: [{ id: 31, role: 'place', label: 'Moon' }] },
    'PUT',
    {
      ...ref,
      collectionName: 'Skies',
      pictures: [{ id: 31, path: 'moon.png' }]
    }
  );
  for (const word of [
    'Skies (#41)',
    'replace',
    'moon.png',
    'Picture #31',
    'place',
    'Moon'
  ])
    assert.ok(collection.includes(word));
  const publish = render(
    '/build/8/publish',
    { expectedFilesHash: '123abc' },
    'POST',
    { ...ref, workshop: { jobId: 2, versionId: 9 } }
  );
  for (const word of ['Publish app #8', 'app version #9', '123abc'])
    assert.ok(publish.includes(word));
  assert.equal(
    render('/build/8/publish', {}, 'POST', { ...ref, payloadHash: '' }),
    ''
  );
});
