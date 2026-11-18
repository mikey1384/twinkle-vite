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
