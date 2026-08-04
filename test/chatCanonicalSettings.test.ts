import assert from 'node:assert/strict';
import test from 'node:test';
import ChatActions from '../src/contexts/Chat/actions';
import {
  applyCanonicalChannelSettings,
  applyCanonicalTopicSettings
} from '../src/contexts/Chat/canonicalSettingsState';

test('topic settings actions retain canonical custom instructions', () => {
  let action: any = null;
  const actions = ChatActions((nextAction) => {
    action = nextAction;
  });

  actions.onChangeTopicSettings({
    channelId: 4,
    topicId: 9,
    topicTitle: 'Canonical title',
    isOwnerPostingOnly: true,
    customInstructions: 'Canonical instructions'
  });

  assert.equal(action.type, 'CHANGE_TOPIC_SETTINGS');
  assert.equal(action.customInstructions, 'Canonical instructions');
});

test('topic settings apply every canonical field and preserve unrelated state', () => {
  const channel = {
    id: 4,
    topicObj: {
      9: {
        id: 9,
        content: 'Old title',
        settings: { customInstructions: 'Old instructions', retained: true }
      }
    }
  };

  const result = applyCanonicalTopicSettings({
    channel,
    topicId: 9,
    topicTitle: 'Canonical title',
    isOwnerPostingOnly: true,
    customInstructions: 'Canonical instructions'
  });

  assert.deepEqual(result.topicObj[9], {
    id: 9,
    content: 'Canonical title',
    settings: {
      customInstructions: 'Canonical instructions',
      retained: true,
      isOwnerPostingOnly: true
    }
  });
});

test('legacy settings events cannot erase canonical fields they do not carry', () => {
  const topicResult = applyCanonicalTopicSettings({
    channel: {
      topicObj: {
        9: { settings: { customInstructions: 'Keep these instructions' } }
      }
    },
    topicId: 9,
    topicTitle: 'Updated title',
    isOwnerPostingOnly: false
  });
  assert.equal(
    topicResult.topicObj[9].settings.customInstructions,
    'Keep these instructions'
  );

  const channelResult = applyCanonicalChannelSettings({
    channel: { theme: 'purple' },
    channelName: 'Updated channel',
    description: '',
    isClosed: false,
    isPublic: false,
    isOwnerPostingOnly: false,
    canChangeSubject: true,
    thumbPath: ''
  });
  assert.equal(channelResult.theme, 'purple');
});

test('channel settings actions and state retain the canonical theme', () => {
  let action: any = null;
  const actions = ChatActions((nextAction) => {
    action = nextAction;
  });
  const canonicalSettings = {
    channelId: 4,
    channelName: 'Canonical channel',
    description: 'Canonical description',
    isClosed: false,
    isPublic: true,
    isOwnerPostingOnly: false,
    canChangeSubject: true,
    theme: 'purple',
    thumbPath: '4/thumb'
  };

  actions.onChangeChannelSettings(canonicalSettings);
  assert.equal(action.type, 'CHANGE_CHANNEL_SETTINGS');
  assert.equal(action.theme, 'purple');

  const result = applyCanonicalChannelSettings({
    channel: { id: 4, retained: true, theme: 'blue' },
    ...action
  });
  assert.deepEqual(result, {
    id: 4,
    retained: true,
    channelName: 'Canonical channel',
    description: 'Canonical description',
    isClosed: false,
    isPublic: true,
    isOwnerPostingOnly: false,
    canChangeSubject: true,
    theme: 'purple',
    thumbPath: '4/thumb'
  });
});
