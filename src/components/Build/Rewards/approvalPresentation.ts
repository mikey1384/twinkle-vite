import type { RewardSettings } from './types';

export function rewardHelpMessage(reviewNote: string) {
  const request =
    'Please help prepare the XP and Coin rewards for this app and address any admin feedback. Handle the setup for me, then let me know when this version is ready to send for approval.';
  return reviewNote
    ? `${request}\n\nAdmin feedback on the rewards proposal:\n${reviewNote}`
    : request;
}

export function rewardApprovalPresentation(
  settings: RewardSettings,
  hasUnsavedChanges = false
) {
  const state =
    hasUnsavedChanges && settings.approvalRequired
      ? 'needs_review'
      : hasUnsavedChanges && settings.state === 'removed'
        ? 'check_changes'
        : settings.state;
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
    not_configured: {
      title: settings.approvalRequired
        ? 'Reward details aren’t ready yet'
        : 'Lumine handles the setup',
      detail: settings.approvalRequired
        ? 'This app uses rewards, but Lumine still needs to prepare the earning rules before you can send it for approval.'
        : 'Tell Lumine how you want people to earn rewards. Lumine will prepare the details for you.'
    },
    needs_review: {
      title: settings.isUpdate
        ? 'Your update needs approval'
        : 'Needs approval',
      detail:
        'An admin needs to check this version before you can publish it. You can keep building while you wait.'
    },
    in_review: {
      title: 'In review',
      detail:
        'Your app is waiting for an admin to check it. If you make more changes, send the new version for review.'
    },
    approved: {
      title: 'Ready to publish',
      detail:
        'This version is approved! You can publish it when you’re ready. More changes that keep rewards will need another review.'
    },
    published: {
      title: 'Approved and live',
      detail:
        'People can earn rewards in your published app. Updates that keep rewards need approval before they go live.'
    },
    changes_requested: {
      title: 'A change is needed',
      detail:
        'The admin left a note. Lumine can help you make the changes and get your app ready for another review.'
    },
    paused: {
      title: 'Rewards are paused',
      detail:
        'The admin paused rewards for this version. Lumine can help you prepare an update for review.'
    }
  };
  return { state, ...messages[state] };
}
