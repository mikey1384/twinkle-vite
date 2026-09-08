# Frontend audit fixes — chat-ux-upgrade

Status: fixed on `chat-ux-upgrade`; these fixes are not merged into master.

## Fixed findings

- **Video-picker loading failures and stale search results:** initial/search reads now have visible error/retry and a 20-second timeout. Query, retry, account and unmount boundaries discard obsolete results. Pagination has a synchronous duplicate lock, timeout, error/retry, ID deduplication and preserves existing results. Selection is cleared when the result scope changes. Invalid result lists produce errors, not a false empty state. Search respects IME composition.
- **Top Scorers loading failures:** scoped viewer/channel reads with timeout, malformed-response handling, visible retry and explicit empty state replace the success-only loading path.
- **New-player NaN%:** zero/missing/non-finite statistics produce finite values and a 0% win rate; normal percentages retain one-decimal rounding. The statistics row can wrap.
- **Keyboard access:** video choices support Enter/Space, focus indication, accessible names and pressed state. Full titles are available in accessible names and focus disclosure; wider cards and three-line visible titles avoid very tall narrow columns. Top Scorers tabs and streak tie-list entry use native buttons. Shared SearchInput ignores composition keys and clamps the active dropdown index.
- **Thumbnail progress:** obsolete video/viewer responses cannot display on a new thumbnail; failed reads are contained without blocking thumbnail selection. Percentages are finite and bounded to 0–100, including the shared progress bar, which now exposes progress semantics. Invalid reward levels cannot create an invalid star array.
- **User-list actions:** profile/chat controls have accessible names and 44px minimum dimensions. Chat lookup is duplicate-guarded, bounded by timeout, validates the response and shows retry guidance. Closing, changing viewer or unmounting invalidates late navigation. Rows wrap for constrained widths. No backend mutation behavior was added.

## Verification

- `test/chatAuditRecovery.test.cjs`: 10 passing tests against actual component/hook source with mocked network and leaf UI. Covers failed reads, retries, out-of-order results, page duplicate/failure recovery, malformed lists, scope/unmount fencing, timeout cleanup, finite statistics, keyboard activation and user-list error/close behavior.
- Focused chat/navigation suite: 465 passed, zero failed (browser-suffixed scripts excluded). TypeScript passes. Production build and production JSX verification pass; existing bundle-size/import warnings remain.
- Connected Chrome, live local Gold desktop: video list loads; Enter selects and Space deselects, with Done correctly enabled/disabled. Canceled without attaching; focus returned to Attach a video. After inspecting the initial overly tall card rendering, adjusted the card columns/title clamp and inspected the corrected view.
- Connected Chrome: Top Scorers populated; keyboard Enter switches to Top 30. Enter on the two-game streak people button opened the named dialog; its profile/chat controls were named and visible. Closing returned focus to the streak button. No profile navigation or DM lookup was exercised live.

Failure/timeout/race scenarios were verified with controlled tests, not by disrupting the live API. Full all-theme, phone/tablet, assistive-technology and physical-device verification remains part of the broader incomplete audit. These targeted fixes do not mark that broader audit complete, make reward writes atomic, or resolve every unrelated full-suite baseline failure.
