# Chat reaction artwork

The original thirteen reaction storage keys are unchanged. The September 20
expression additions are Happy, Unimpressed, Sad, Miserable and Panicking:
eighteen reactions in total.

## Quick page customization

The first page defaults to the existing eight reactions. **More reactions** opens
all eighteen; **Customize quick reactions** lets users choose one to eight and
save them in selection order. Restore defaults and Cancel do not save until the
user presses Save. Customization never posts a message reaction.

Preferences are stored per account on this browser, not synced between devices.
Invalid/obsolete stored keys are filtered safely. Blocked browser storage retains
session-only choices and says so; other open pickers/tabs receive updates.

## Assets and generation

Final assets live in `public/img/chat-reactions/*-v2.png`: thumb, heart, laughing,
surprised, wave, crying, angry, fire, eyes, thinking, celebrate, clap, thanks,
happy, unimpressed, sad, miserable and panicking.
Each is a 160 × 160 RGBA PNG under 45 KB. The five new expression assets were
resized with macOS `sips` after explicit user approval, preserving alpha and the
original generated source files.
The exact prompts and original output locations are in
[`chat-reaction-art-prompts.json`](./chat-reaction-art-prompts.json).
The September 20 additions were generated separately with built-in imagegen,
using Laughing, Crying and Surprised as style references. Their exact prompts,
references and original output paths are recorded in
[`reaction-expression-additions.json`](./reaction-expression-additions.json).
Their generated alpha transparency is preserved.

The later expression revisions are recorded in
[`balanced-style-transfer.json`](./reaction-face-revision/balanced-style-transfer.json).
The current contour cleanup for Angry, Eyes, Wave, Clap, Thanks, Fire and Thinking
is recorded in [`border-cleanup.json`](./reaction-face-revision/border-cleanup.json).
These revisions replace drawn outer strokes and hard rim lighting with softer
surface shading while retaining the reaction expressions and gestures.

For the earlier artwork, built-in imagegen produced one image per reaction. Those outputs contained baked
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

The earlier UI audit passed all 380 chat/navigation checks, including six new
regressions for the fractional-width top-navigation overlap. Full TypeScript
checking and focused ESLint pass. The restored controls were rechecked in live
Chrome, all four CSS viewports and all 11 profile themes.
Physical touch devices and the full live responsive parents remain separate
coverage; this fixture omits profile tooltips and people dialogs. The broader
chat-component audit is not complete; see its evidence ledger for those branches.

## September 20 picker positioning and hover correction

The picker opens to the left and extends upward from the trigger's bottom edge
when it fits. A hoverable six-pixel gap and 200ms dismissal delay let the pointer
cross sideways or diagonally. Narrow chats retain the fitted vertical placement.
The message row keeps its action buttons visible while the picker is open:
hiding them on row hover loss collapses the anchor and causes the popup to jump
under and away from an upward-moving pointer.

Connected Chrome verification used the actual message-row CSS and reaction
components. The previous row behavior reproduced an open popup after the pointer
had moved above and outside it; the corrected row dismissed cleanly. Diagonal
entry into the left popup stayed open with an unfocused trigger and stable
geometry. The five new images also loaded at 28px in 44px choice buttons, and
Panicking selected its intended key. The 32 picker/layout/preferences checks,
including new-expression customization and reload persistence, passed alongside
TypeScript and focused ESLint. Compact asset checks cover all eighteen PNGs.

## Release coordination

The API already enforces the 2.2.12 client floor, the first website release with
the safe unknown-key renderer. Earlier seven-key sprite clients are already
required to refresh. The September 20 additions therefore need no new floor:
admitted older bundles show the unknown-key fallback until refreshed, while the
new bundle includes all eighteen images. Verify the shipping and outgoing client
versions both receive `match: true` before the website push, then check the live
bundle and new assets after promotion.

The existing human-reaction API accepts the new string keys; AI automatic
reaction selection remains on its existing whitelist and was not changed.
