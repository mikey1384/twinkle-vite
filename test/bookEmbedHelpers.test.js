import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { transform } from 'esbuild';

const source = readFileSync(
  new URL('../src/helpers/bookEmbedHelpers.ts', import.meta.url),
  'utf8'
);
const { code } = await transform(source, { loader: 'ts', format: 'esm' });
const {
  parseBookLink,
  embedStandaloneBookLinks,
  getSubjectDisplayDescription
} = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);

test('only Book Maker reader links resolve as books and preserve the reader destination', () => {
  for (const prefix of [
    '',
    'https://www.twin-kle.com',
    'https://twinkle.network',
    'www.twin-kle.com',
    'http://localhost:3000'
  ]) {
    assert.deepEqual(
      parseBookLink(prefix + '/app/884/9-the-book?from=chat#page'),
      { subjectId: 9, path: '/app/884/9-the-book?from=chat#page' }
    );
  }
  for (const url of [
    '/app/884',
    '/build/884',
    '/app/883/9',
    '/app/884/0',
    '/app/884/1.2',
    '/app/884/9/extra',
    '/app/884/9007199254740992',
    '//evil.test/app/884/9',
    'https://www.twin-kle.com.evil.test/app/884/9',
    'https://attacker@www.twin-kle.com/app/884/9',
    'javascript:/app/884/9'
  ])
    assert.equal(parseBookLink(url), null, url);
});

test('standalone pasted links embed; code, explicit links and inline prose stay intact', () => {
  const url = 'https://www.twin-kle.com/app/884/9-the-book';
  assert.equal(
    embedStandaloneBookLinks('Read this\n\n' + url),
    'Read this\n\n![Book](' + url + ')'
  );
  for (const text of [
    'Try ' + url,
    '[read](' + url + ')',
    '![book](' + url + ')',
    '    ' + url,
    '```text\n' + url + '\n```',
    '~~~\n' + url + '\n~~~',
    '<pre>\n' + url + '\n</pre>'
  ])
    assert.equal(embedStandaloneBookLinks(text), text);
});

test('saved books get one default subject card without modifying cover/editor source', () => {
  const subject = {
    id: 9,
    bookAvailable: 1,
    description: 'The opening description.'
  };
  const displayed = getSubjectDisplayDescription(subject);
  assert.equal(
    displayed,
    subject.description + '\n\n![Read book](https://www.twin-kle.com/app/884/9)'
  );
  assert.equal(subject.description, 'The opening description.');
  assert.equal(
    getSubjectDisplayDescription({ ...subject, description: displayed }),
    displayed
  );
  const existing = 'https://www.twin-kle.com/app/884/9-the-book';
  assert.equal(
    getSubjectDisplayDescription({ ...subject, description: existing }),
    existing
  );
  assert.equal(
    getSubjectDisplayDescription({ ...subject, bookAvailable: false }),
    subject.description
  );
  assert.equal(
    getSubjectDisplayDescription({ ...subject, id: 0 }),
    subject.description
  );
  assert.match(
    getSubjectDisplayDescription({ ...subject, description: '' }),
    /^!\[Read book\]/
  );
});
