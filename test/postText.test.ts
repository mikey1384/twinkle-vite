import test from 'node:test';
import assert from 'node:assert/strict';
import { findPostLink, splitPostText } from '../src/helpers/postText';

test('typed text becomes a title and a description without rewriting', () => {
  assert.deepEqual(splitPostText('  Who likes Groove Lab?  '), {
    title: 'Who likes Groove Lab?',
    description: ''
  });
  assert.deepEqual(splitPostText('My story\nOnce upon a time.\nThe end.'), {
    title: 'My story',
    description: 'Once upon a time.\nThe end.'
  });
  const long = `${'A sentence that goes on for a while. '.repeat(6)}${'word '.repeat(60)}`;
  const { title, description } = splitPostText(long);
  assert.ok(title.length <= 300);
  assert.ok(title.endsWith('.'));
  assert.equal(
    `${title} ${description}`.replace(/\s+/g, ' ').trim(),
    long.replace(/\s+/g, ' ').trim()
  );
});

test('the first link is found with the text around it', () => {
  assert.deepEqual(
    findPostLink('watch this https://youtu.be/abc123! so cool'),
    {
      url: 'https://youtu.be/abc123',
      rest: 'watch this so cool'
    }
  );
  assert.equal(findPostLink('no link here, just words.'), null);
  assert.equal(findPostLink('go to www.example.com.')?.url, 'www.example.com');
});
