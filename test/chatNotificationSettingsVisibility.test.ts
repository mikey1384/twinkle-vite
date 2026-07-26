import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('the per-chat menu owns push notification muting', () => {
  const headerSource = readSource(
    'src/containers/Chat/Body/MessagesContainer/ChannelHeader/index.tsx'
  );
  const chatInfoSource = readSource(
    'src/containers/Chat/RightMenu/ChatInfo/index.tsx'
  );

  // The mute item is shown whenever the mute could affect anything: any device
  // on the account subscribed to push, or this browser raising in-page
  // notifications. `!== false` keeps it visible against an API that predates
  // hasPushSubscription rather than hiding a working account-level control.
  assert.match(
    headerSource,
    /notificationSettings\?\.hasPushSubscription !== false \|\|\s*deviceNotificationsEnabled/
  );
  assert.match(
    headerSource,
    /!!notificationSettings && \(muteCanAffectSomething \|\| notificationsMuted\)/
  );
  assert.match(headerSource, /Mute push notifications/);
  assert.match(headerSource, /Unmute push notifications/);
  assert.match(
    headerSource,
    /await updateChatNotificationMute\([\s\S]*?onSetChatNotificationSettings\(settings\)/
  );
  assert.match(
    headerSource,
    /if \(!userId \|\| notificationSettings\) return;[\s\S]*?await loadChatNotificationSettings\(\)[\s\S]*?onSetChatNotificationSettings\(settings\)/
  );
  assert.doesNotMatch(chatInfoSource, /Mute push notifications/);
  assert.doesNotMatch(chatInfoSource, /updateChatNotificationMute/);
});

test('advanced notification settings are collapsed by default', () => {
  const source = readSource(
    'src/containers/Home/Store/ChatNotificationsItem.tsx'
  );
  const primarySettingIndex = source.indexOf(
    'label="Allow notifications on this device"'
  );
  const disclosureIndex = source.indexOf(
    'aria-expanded={advancedSettingsShown}'
  );
  const advancedGateIndex = source.indexOf('{advancedSettingsShown && (');
  const backgroundSettingsIndex = source.indexOf(
    'While Twinkle is in the background'
  );

  assert.match(
    source,
    /const \[advancedSettingsShown, setAdvancedSettingsShown\] =\s*useState\(false\)/
  );
  assert(primarySettingIndex >= 0);
  assert(disclosureIndex > primarySettingIndex);
  assert(advancedGateIndex > disclosureIndex);
  assert(backgroundSettingsIndex > advancedGateIndex);
});
