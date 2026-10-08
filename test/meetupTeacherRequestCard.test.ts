import assert from 'node:assert/strict';
import test from 'node:test';
import { teacherRequestStatusLine } from '../src/containers/Chat/Message/MessageBody/meetupTeacherRequestState';

// The request card a picked Twinkle teacher answers: the teacher sees buttons
// while it is open; the student who sent it sees where it stands.
test('the teacher and the student each read the request state in their own words', () => {
  const line = (status: any, isTeacher: boolean) =>
    teacherRequestStatusLine({ status, isTeacher, teacherUsername: 'teacher6' });
  assert.equal(line('open', true), '', 'the teacher sees the buttons instead');
  assert.equal(line('open', false), 'Waiting for teacher6 to answer.');
  assert.equal(line('accepted', true), "You said you're coming.");
  assert.equal(line('accepted', false), "teacher6 said yes: they're coming.");
  assert.equal(line('declined', true), "You said this isn't you.");
  assert.equal(line('declined', false), "teacher6 can't come. Pick another grown-up on the crew page.");
  assert.equal(line('replaced', true), 'The crew picked someone else.');
  assert.equal(line('cancelled', false), "The crew's plan changed, so this request is closed.");
});

test('a released yes, a changed plan and a taken-back yes each say so plainly', () => {
  const line = (status: any, isTeacher: boolean, extra: any = {}) =>
    teacherRequestStatusLine({ status, isTeacher, teacherUsername: 'teacher6', ...extra });
  assert.equal(
    line('released', true, { releasedFor: 'picked_someone_else' }),
    'No longer needed: the crew picked another grown-up. Thank you for saying yes!'
  );
  assert.equal(line('released', false, { releasedFor: 'classroom' }), 'No longer needed: the crew is meeting in a Twinkle classroom.');
  // a yes to an older plan is asked again, never "no longer needed"
  assert.equal(
    line('released', true, { releasedFor: 'plan_changed' }),
    'The plan changed. Please confirm the new date and place in the new request.'
  );
  assert.equal(
    line('released', false, { releasedFor: 'plan_changed' }),
    'The plan changed. A new request with the new plan went to teacher6.'
  );
  assert.equal(line('plan_changed', true), 'The plan changed, so a new request with the new plan replaces this one.');
  assert.equal(line('declined', true, { afterYes: true }), "You said you can't make it after all.");
  assert.equal(
    line('declined', false, { afterYes: true }),
    "teacher6 can't make it after all. Pick another grown-up on the crew page."
  );
});

