import type { RewardSettings } from './types';

// Plain-language status for creators (kids and teens). There is nothing for
// them or their Lumine to prepare: they save code, send it, and an admin reads
// the code and decides what the app can pay. Every string here must make sense
// without knowing rule IDs, budgets or answer keys.
export function rewardApprovalPresentation(
  settings: RewardSettings,
  hasUnsavedChanges = false
) {
  // An API that predates this client may still report the retired
  // 'not_configured' state; for the creator that simply means "send it".
  const serverState: RewardSettings['state'] =
    (settings.state as string) === 'not_configured'
      ? 'needs_review'
      : settings.state;
  const state =
    hasUnsavedChanges && settings.approvalRequired
      ? 'needs_review'
      : hasUnsavedChanges && serverState === 'removed'
        ? 'check_changes'
        : serverState;
  const messages = {
    removed: {
      title: 'No reward approval needed',
      detail:
        'This version no longer uses XP or Coin rewards. You can publish it without reward approval. Adding rewards back will need a new review.'
    },
    check_changes: {
      title: 'Your changes will be checked',
      detail:
        'When you publish, we’ll save and check your changes. If you added rewards back, this version will need approval.'
    },
    needs_review: {
      title: settings.isUpdate
        ? 'Your update needs approval'
        : 'This app needs approval before it can go public',
      detail:
        // A pending request closes itself the moment a newer version is
        // saved (it could never be published), so say so instead of letting
        // the creator wait for an answer that will never come.
        (settings.requestClosedBySave
          ? 'You saved a newer version after sending your last request, so that request was closed. '
          : '') +
        'Apps that give real XP and Coins are checked by a Twinkle admin first. Send this version and the admin will read your code and decide what people can earn. You can keep building while you wait.'
    },
    in_review: {
      title: 'Waiting for the admin',
      detail:
        'Your app has been sent. The admin will read your code and set the rewards. If you save more changes, you’ll need to send the new version.'
    },
    approved: {
      title: 'Approved · ready to publish',
      detail:
        'The admin approved this version and set what people can earn. Publish it when you’re ready. Changes that keep rewards will need another approval.'
    },
    published: {
      title: 'Approved and live',
      detail:
        'People can earn rewards in your published app. Updates that keep rewards need approval before they go live.'
    },
    changes_requested: {
      title: 'Not approved yet',
      detail:
        'The admin left a note below. Make the changes, save, and send the new version for review.'
    },
    paused: {
      title: 'Rewards are paused',
      detail:
        'The admin paused rewards for this version and left a note below. Update your app, save, and send it for review again.'
    }
  };
  return { state, ...messages[state] };
}
