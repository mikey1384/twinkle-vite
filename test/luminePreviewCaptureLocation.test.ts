import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLuminePreviewCaptureLocation,
  isLuminePreviewCaptureCredential,
  isLuminePreviewCaptureContext,
  normalizeLuminePreviewCaptureId
} from '../src/helpers/luminePreviewCapture';

const id = '1234567890abcdef1234567890abcdef';

test('capture-only socket policy requires the capture route and a valid capture id', () => {
  assert.equal(normalizeLuminePreviewCaptureId(`  ${id.toUpperCase()}  `), id);
  for (const [pathname, search, expected] of [
    ['/app-capture/900001', `?lumineCaptureId=${id}`, true],
    ['/app-capture/900001/', `?lumineCaptureId=${id.toUpperCase()}`, true],
    ['/app-capture/900001', '', false],
    ['/app-capture/900001', '?lumineCaptureId=not-a-capture', false],
    ['/app/900001', `?lumineCaptureId=${id}`, false],
    ['/app/900001/scene', `?lumineCaptureId=${id}`, false],
    ['/app-capture/900001/scene', `?lumineCaptureId=${id}`, false]
  ] as const) {
    assert.equal(isLuminePreviewCaptureLocation({ pathname, search }), expected, pathname + search);
  }
});

test('a capture credential stays socketless across navigation, without treating it as authorization', () => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const capture = `${encode({ alg: 'HS256' })}.${encode({ capture: 'lumine-preview' })}.signature`;
  const session = `${encode({ alg: 'HS256' })}.${encode({ twinkleSession: true })}.signature`;
  assert.equal(isLuminePreviewCaptureCredential(capture), true);
  assert.equal(isLuminePreviewCaptureCredential(session), false);
  assert.equal(isLuminePreviewCaptureCredential('not-a-jwt'), false);
  assert.equal(isLuminePreviewCaptureCredential('header.invalid.signature'), false);
  assert.equal(isLuminePreviewCaptureContext({ pathname: '/app/1', search: '' }, capture), true);
  assert.equal(isLuminePreviewCaptureContext({ pathname: '/app/1', search: '' }, session), false);
});
