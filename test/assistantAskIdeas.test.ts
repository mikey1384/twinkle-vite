import assert from 'node:assert/strict';
import test from 'node:test';
import { askIdeasFor } from '../src/containers/App/AssistantDock/askIdeas';

test('text keeps its rewrite bubbles; apps, achievements and bounties get their own questions', () => {
  assert.ok(askIdeasFor({ kind: 'comment' }).includes('Rewrite it as a poem'));
  assert.equal(askIdeasFor({ kind: 'video' })[0], 'What is this video about?');
  assert.deepEqual(askIdeasFor({ kind: 'build' }).slice(0, 2), [
    'How do I play this?',
    'Any tips to play better?'
  ]);
  assert.equal(askIdeasFor({ kind: 'build', focus: 'rewards' })[0], 'How do I earn the rewards?');
  assert.equal(askIdeasFor({ kind: 'achievement' })[0], 'How do I unlock this?');
  assert.equal(askIdeasFor({ kind: 'pass', rootType: 'achievement' })[0], 'How do I unlock this?');
  assert.equal(askIdeasFor({ kind: 'pass', rootType: 'mission' })[0], 'How do I pass this mission?');
  assert.equal(askIdeasFor({ kind: 'bounty' })[0], 'How do I earn this bounty?');
  assert.equal(askIdeasFor({ kind: 'page', path: '/achievements/gold' })[0], 'How do I unlock this?');
  assert.equal(askIdeasFor({ kind: 'page', path: '/earn' })[0], 'Which bounty should I try?');
  assert.deepEqual(askIdeasFor({ kind: 'page', path: '/somewhere' }), []);
  assert.deepEqual(askIdeasFor(null), []);
});

test('an AI story gets how-to-play bubbles, never "explain it" or rewrites', () => {
  const ideas = askIdeasFor({ kind: 'aiStory' });
  assert.ok(ideas.includes('How does AI Story work?'));
  assert.ok(!ideas.includes('Make it easy to understand'));
  assert.ok(!ideas.some((idea) => idea.startsWith('Rewrite')));
});
