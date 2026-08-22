import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const collaborationPanelSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const ownerTeamPanelSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/OwnerTeamPanel.tsx',
    import.meta.url
  ),
  'utf8'
);
const collaborationSettingsSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationSettingsModal.tsx',
    import.meta.url
  ),
  'utf8'
);

test('owner join requests render above the embedded Team forum', () => {
  const embeddedBodyStart = collaborationPanelSource.indexOf(
    'function renderEmbeddedBody()'
  );
  const nonOwnerBodyStart = collaborationPanelSource.indexOf(
    'if (!isContributionFork)',
    embeddedBodyStart
  );
  const ownerBodySource = collaborationPanelSource.slice(
    embeddedBodyStart,
    nonOwnerBodyStart
  );
  const joinRequestsIndex = ownerBodySource.indexOf('showJoinRequests: true');
  const forumIndex = ownerBodySource.indexOf('renderForum()');
  const teamManagementIndex = ownerBodySource.indexOf(
    'renderOwnerTeamPanel({ showJoinRequests: false })'
  );

  assert.ok(joinRequestsIndex >= 0);
  assert.ok(forumIndex > joinRequestsIndex);
  assert.ok(teamManagementIndex > forumIndex);
  assert.match(ownerTeamPanelSource, /\{showJoinRequests \? \(/);
  assert.match(ownerTeamPanelSource, /\{showTeamManagement \? \(/);
});

test('join-request actions reconcile from the canonical request list', () => {
  const acceptStart = collaborationPanelSource.indexOf(
    'async function handleAcceptCollaborationRequest'
  );
  const rejectStart = collaborationPanelSource.indexOf(
    'async function handleRejectCollaborationRequest',
    acceptStart
  );
  const hideStart = collaborationPanelSource.indexOf(
    'async function handleHideCollaborationRequest',
    rejectStart
  );
  const revokeStart = collaborationPanelSource.indexOf(
    'async function handleRevokeContributor',
    hideStart
  );
  const acceptSource = collaborationPanelSource.slice(acceptStart, rejectStart);
  const rejectSource = collaborationPanelSource.slice(rejectStart, hideStart);
  const hideSource = collaborationPanelSource.slice(hideStart, revokeStart);

  assert.match(
    acceptSource,
    /await Promise\.all\(\[[\s\S]*?reloadCollaborationRequests\(showHiddenCollaborationRequests\)[\s\S]*?reloadContributors\(\)/
  );
  assert.match(
    rejectSource,
    /await reloadCollaborationRequests\(showHiddenCollaborationRequests\)/
  );
  assert.match(
    hideSource,
    /await reloadCollaborationRequests\(showHiddenCollaborationRequests\)/
  );
  assert.doesNotMatch(
    `${acceptSource}\n${rejectSource}\n${hideSource}`,
    /setCollaborationRequests|nextPendingCount/
  );
  assert.equal(
    (
      ownerTeamPanelSource.match(
        /loadingCollaborationRequests \|\|\s+Boolean\(actionLoading\)/g
      ) || []
    ).length,
    4
  );
  assert.match(
    collaborationPanelSource,
    /activeCollaborationRequestViewIdentityRef\.current !== loadIdentity[\s\S]*loadSequence !== collaborationRequestLoadSequenceRef\.current/
  );
  assert.match(
    collaborationPanelSource,
    /activeOwnerCollaborationIdentityRef\.current !== loadIdentity[\s\S]*loadSequence !== contributorLoadSequenceRef\.current/
  );
  const settingsRevokeSource = collaborationSettingsSource.slice(
    collaborationSettingsSource.indexOf(
      'async function handleRevokeContributor'
    )
  );
  assert.match(
    settingsRevokeSource,
    /await revokeBuildContributor\([\s\S]*await reloadContributors\(\)/
  );
  assert.doesNotMatch(settingsRevokeSource, /setContributors\(\(current\)/);
  assert.match(
    collaborationSettingsSource,
    /activeBuildIdRef\.current !== buildId[\s\S]*loadSequence !== contributorLoadSequenceRef\.current/
  );
  assert.match(
    collaborationSettingsSource,
    /contributorsReady \? \([\s\S]*<ContributorInvitePicker/
  );
});
