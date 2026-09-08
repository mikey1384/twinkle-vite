# Chat UX upgrade checkpoint

This branch contains the responsive chat navigation, message/media presentation,
customizable thirteen-reaction picker/artwork, keyboard controls and async-dialog
recovery work. It preserves the newer master upload-dialog continuity fix.

The component audit is **not complete**. This is a checkpoint, not a claim that
every component, theme or physical device has been verified. The latest local
source ledger records 303 matching full-read hashes in a 525-file inventory;
older reading notes still need reconciliation and changed sources need rereading.

## Validation on Windows, 2026-09-08

- Final merged production build and production JSX verification: passed. Existing
  large-chunk and mixed static/dynamic import warnings remain.
- TypeScript: passed after correcting the topic dialog to use Modal's React-node
  `header` prop instead of its string-only `title` prop.
- Focused chat/navigation suite: 455 passed, zero failed; browser-suffixed tests
  excluded from this command.
- Full suite after integrating master: 1,157 passed, 14 failed, one skipped.
  All 14 failure cases also occurred in a clean worktree of origin/master
  `1f295057f` (that baseline had 15 failures). This is not a clean full-suite pass.
  Four browser scripts reference a Mac-only global Playwright installation;
  remaining failures are existing source/contract assertions.
- The AI Card mobile-control contract test was updated to check the extracted
  chat container stylesheet and its actual use in Main; its layout requirement
  was retained.

## Remaining work and rollout limits

- The video-picker, Top Scorers, zero-game statistics, keyboard-access,
  thumbnail-progress and user-list findings are now fixed locally on
  `chat-ux-upgrade`. See [fixes and verification](chat-ux-audit-fixes.md).
- Full all-theme/device validation and remaining component reads.
- Reward submission still uses multiple backend writes; UI guards do not make
  the transaction atomic or guarantee idempotency.

Existing clients assume the old seven-reaction sprite keys. They must refresh
before receiving newly added reaction keys; the new client's fallback cannot
repair an already-running old bundle. See chat-reaction-art.md. Pushing this
repository does not establish that production clients have refreshed.

The missing-table database repair was applied only to the local development
database using an existing API migration. No database credentials, local dumps,
environment files, preview servers or generated build output are included here.
