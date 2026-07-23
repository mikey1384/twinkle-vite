import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('conversation mute is shown only after canonical settings load', () => {
  const source = readSource(
    'src/containers/Chat/RightMenu/ChatInfo/index.tsx'
  );
  const muteLabelIndex = source.indexOf('Mute push notifications');
  const settingsGateIndex = source.lastIndexOf(
    '{notificationSettings && (',
    muteLabelIndex
  );
  const membersIndex = source.indexOf('{!isAIChat && (', muteLabelIndex);

  assert(settingsGateIndex >= 0);
  assert(muteLabelIndex > settingsGateIndex);
  assert(membersIndex > muteLabelIndex);
  assert.doesNotMatch(
    source.slice(settingsGateIndex, membersIndex),
    /Overrides your notification settings/
  );
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
