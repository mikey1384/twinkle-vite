import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BUILD_RUNTIME_WORLD_EVENT_BURST,
  BUILD_RUNTIME_WORLD_EVENTS_PER_SECOND,
  createBuildRuntimeWorldAdmission
} from '../src/containers/Build/PreviewPanel/helpers/buildRuntimeWorldAdmission';

test('Build world presence and action traffic share a bounded host admission budget', () => {
  let now = 0;
  const admission = createBuildRuntimeWorldAdmission({ now: () => now });

  const initialAdmissions = Array.from(
    { length: BUILD_RUNTIME_WORLD_EVENT_BURST },
    (_, index) =>
      admission.admit(
        index % 2 === 0
          ? 'build_app_world_update_presence'
          : 'build_app_world_send'
      )
  );
  assert(initialAdmissions.every((result) => result.admitted));

  const rejected = admission.admit('build_app_world_send');
  assert.equal(rejected.admitted, false);
  assert.equal(
    rejected.retryAfterMs,
    Math.ceil(1000 / BUILD_RUNTIME_WORLD_EVENTS_PER_SECOND)
  );

  now += Math.ceil(1000 / BUILD_RUNTIME_WORLD_EVENTS_PER_SECOND);
  assert.equal(
    admission.admit('build_app_world_update_presence').admitted,
    true
  );
});

test('Build world lifecycle traffic is admitted without consuming realtime update tokens', () => {
  const admission = createBuildRuntimeWorldAdmission({
    now: () => 0,
    eventsPerSecond: 1,
    burst: 1
  });

  assert.equal(admission.admit('build_app_world_join').admitted, true);
  assert.equal(admission.admit('build_app_world_heartbeat').admitted, true);
  assert.equal(admission.admit('build_app_world_leave').admitted, true);
  assert.equal(admission.admit('build_app_world_send').admitted, true);
  assert.equal(
    admission.admit('build_app_world_update_presence').admitted,
    false
  );
});
