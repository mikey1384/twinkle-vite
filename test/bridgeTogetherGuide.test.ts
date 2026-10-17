import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOTSPOT_STEPS,
  SOUND_STEPS,
  detectPlatform
} from '../src/containers/BridgeBuilderQuest/Checkin/TogetherGuide';

// The "show you're together" guide (Mikey 10-17): each kid sees the steps for
// their own phone, and every path ends with the scan that proves it.

test('the guide picks the phone from the browser', () => {
  assert.equal(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 14; SM-S921N)'), 'android');
});

test('every path has short, complete steps and ends with "scan each other again"', () => {
  const paths = [
    SOUND_STEPS,
    HOTSPOT_STEPS.share.ios,
    HOTSPOT_STEPS.share.android,
    HOTSPOT_STEPS.join.ios,
    HOTSPOT_STEPS.join.android
  ];
  for (const steps of paths) {
    assert.ok(steps.length >= 3 && steps.length <= 5, String(steps.length));
    for (const step of steps) {
      assert.ok(step.icon && step.title && step.text, JSON.stringify(step));
      // one idea per screen: titles stay short
      assert.ok(step.title.length <= 40, step.title);
    }
    assert.match(steps[steps.length - 1].title, /Scan each other again/);
  }
  // sharing shows where the password is; joining asks for it
  assert.ok(HOTSPOT_STEPS.share.ios.some((s) => /password/i.test(s.text)));
  assert.ok(HOTSPOT_STEPS.join.android.some((s) => /password/i.test(s.title)));
});
