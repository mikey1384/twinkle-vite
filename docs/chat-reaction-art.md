# Chat reaction artwork

The original seven reaction storage keys are unchanged. The user approved Fire,
then Eyes, Thinking, Celebrate, Clap and Thanks: thirteen reactions in total.

## Quick page customization

The first page defaults to the existing eight reactions. **More reactions** opens
all thirteen; **Customize quick reactions** lets users choose one to eight and
save them in selection order. Restore defaults and Cancel do not save until the
user presses Save. Customization never posts a message reaction.

Preferences are stored per account on this browser, not synced between devices.
Invalid/obsolete stored keys are filtered safely. Blocked browser storage retains
session-only choices and says so; other open pickers/tabs receive updates.

## Assets and generation

Final assets live in `public/img/chat-reactions/*-v2.png`: thumb, heart, laughing,
surprised, wave, crying, angry, fire, eyes, thinking, celebrate, clap and thanks.
Each is a 160 × 160 RGBA PNG under 45 KB.
The exact prompts and original output locations are in
[`chat-reaction-art-prompts.json`](./chat-reaction-art-prompts.json).

Built-in imagegen produced one image per reaction. The outputs contained baked
checkerboard backgrounds, so user-authorized direct pixel cleanup removed the
edge-connected background and resized the art with transparent padding. Original
generated files were preserved; existing sprite artwork was not overwritten.

## Integration and verification

`chatReactionOptions` owns stable keys and accessible names. `ChatReactionEmoji`
provides fixed-size artwork with Unicode image-error fallbacks. The picker,
message reaction chips, reaction dialog title and channel latest-reaction preview
use the shared renderer.

Connected Chrome checks cover the live quick/all/customization pages and actions
menu without selecting a live reaction or saving preferences. The isolated picker
also verifies keyboard selection, customization, Save/Restore, reload persistence
and account separation. All 11 profile themes and 320 × 740, 768 × 1024,
960 × 480 and 1366 × 768 CSS viewports were visually inspected, including a
140-pixel message scroller. Picker choices remain 44 × 44 pixels. Reaction chips
retain minimum 36 × 32 desktop buttons and 44 × 44 tablet/phone/coarse buttons.

Message reaction and actions triggers retain their original dark-gray solid,
raised styling with white icons. They share compact 30 × 30 surfaces and hit
areas, 14-pixel icons and a consistent 4-pixel gap on all screen sizes. The
previous invisible 44-pixel footprints were removed because they spread the
controls too far apart. Keyboard-induced ancestor scrolling still refits the
focused menu instead of immediately dismissing it.

The latest correction passes all 380 chat/navigation checks, including six new
regressions for the fractional-width top-navigation overlap. Full TypeScript
checking and focused ESLint pass. The restored controls were rechecked in live
Chrome, all four CSS viewports and all 11 profile themes.
Physical touch devices and the full live responsive parents remain separate
coverage; this fixture omits profile tooltips and people dialogs. The broader
chat-component audit is not complete; see its evidence ledger for those branches.

## Release coordination

These are local changes, not a deployment. Pre-upgrade clients assume the old
seven-key sprite mapping and may crash on unfamiliar reaction keys. Refresh old
client bundles before allowing newly added keys to reach them; publishing assets
alone is not sufficient. The new renderer has an unknown-key fallback, but this
does not repair clients that are already running old code.

The existing human-reaction API accepts the new string keys; AI automatic
reaction selection remains on its existing whitelist and was not changed.
