import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BranchMainUpdateNotice from '../src/containers/Build/Editor/BranchMainUpdateNotice';
import {
  resolveBranchMainUpdateNoticeState,
  resolveBuildProjectLumineFixScope,
  selectCurrentBranchCanonicalContribution,
  shouldLoadCurrentBranchLumineFixState,
  shouldShowStandaloneBranchLumineFixAction,
  shouldShowStandaloneBuildProjectLumineFix
} from '../src/helpers/branchMainUpdateNotice';

test('canonical project state patches only the branch open in this workspace', () => {
  const contribution = { id: 42, contributionStatus: 'merging' };
  assert.equal(
    selectCurrentBranchCanonicalContribution({
      contributionBuildId: 42,
      result: { contributionBuildId: 42, contribution }
    }),
    contribution
  );
  assert.equal(
    selectCurrentBranchCanonicalContribution({
      contributionBuildId: 41,
      result: { contributionBuildId: 42, contribution }
    }),
    null
  );
  assert.equal(
    selectCurrentBranchCanonicalContribution({
      contributionBuildId: 42,
      result: {
        rootBuildId: 9,
        branchBuildId: 42,
        contribution,
        lumineFix: null,
        eventTimeMs: 1_700_000_000_000
      }
    }),
    contribution
  );
});

test('recovery reads the open branch only when project state cannot supply it', () => {
  assert.equal(
    shouldLoadCurrentBranchLumineFixState({
      contributionBuildId: 42,
      projectResult: {
        contributionBuildId: 42,
        contribution: { id: 42, contributionStatus: 'merging' }
      }
    }),
    false
  );
  assert.equal(
    shouldLoadCurrentBranchLumineFixState({
      contributionBuildId: 42,
      projectResult: {
        contributionBuildId: null,
        contribution: null,
        lumineFix: null
      }
    }),
    true
  );
  assert.equal(
    shouldLoadCurrentBranchLumineFixState({
      contributionBuildId: 42,
      projectResult: {
        contributionBuildId: 43,
        contribution: { id: 43, contributionStatus: 'merging' }
      }
    }),
    true
  );
  assert.equal(
    shouldLoadCurrentBranchLumineFixState({
      contributionBuildId: 0,
      projectResult: { contribution: null, lumineFix: null }
    }),
    false
  );
});

test('project repair scope separates accepted membership from branch ownership', () => {
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 9,
      contributionRootBuildId: null,
      isContributionFork: false,
      userId: 11,
      isCurrentBuildOwner: true,
      isProjectOwner: true,
      canOpenContributionWorkspace: false
    }),
    { active: true, rootBuildId: 9, openContributionBuildId: 0 }
  );
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 9,
      contributionRootBuildId: null,
      isContributionFork: false,
      userId: 33,
      isCurrentBuildOwner: false,
      isProjectOwner: false,
      canOpenContributionWorkspace: true
    }),
    { active: true, rootBuildId: 9, openContributionBuildId: 0 }
  );
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 42,
      contributionRootBuildId: 9,
      isContributionFork: true,
      userId: 33,
      isCurrentBuildOwner: false,
      isProjectOwner: false,
      canOpenContributionWorkspace: true
    }),
    { active: true, rootBuildId: 9, openContributionBuildId: 42 }
  );
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 42,
      contributionRootBuildId: 9,
      isContributionFork: true,
      userId: 22,
      isCurrentBuildOwner: true,
      isProjectOwner: false,
      canOpenContributionWorkspace: false
    }),
    { active: true, rootBuildId: 9, openContributionBuildId: 42 }
  );
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 42,
      contributionRootBuildId: 9,
      isContributionFork: true,
      userId: 11,
      isCurrentBuildOwner: false,
      isProjectOwner: true,
      canOpenContributionWorkspace: false
    }),
    { active: true, rootBuildId: 9, openContributionBuildId: 42 }
  );
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 9,
      contributionRootBuildId: null,
      isContributionFork: false,
      userId: 33,
      isCurrentBuildOwner: false,
      isProjectOwner: false,
      canOpenContributionWorkspace: false
    }),
    { active: false, rootBuildId: 9, openContributionBuildId: 0 }
  );
  assert.deepEqual(
    resolveBuildProjectLumineFixScope({
      currentBuildId: 9,
      contributionRootBuildId: null,
      isContributionFork: false,
      userId: 0,
      isCurrentBuildOwner: false,
      isProjectOwner: false,
      canOpenContributionWorkspace: true
    }),
    { active: false, rootBuildId: 9, openContributionBuildId: 0 }
  );
});

test('only a teammate without an existing owner repair surface gets the standalone project control', () => {
  assert.equal(
    shouldShowStandaloneBuildProjectLumineFix({
      hasLumineFix: true,
      isCurrentBuildOwner: false,
      isProjectOwner: false
    }),
    true
  );
  assert.equal(
    shouldShowStandaloneBuildProjectLumineFix({
      hasLumineFix: true,
      isCurrentBuildOwner: true,
      isProjectOwner: false
    }),
    false
  );
  assert.equal(
    shouldShowStandaloneBuildProjectLumineFix({
      hasLumineFix: true,
      isCurrentBuildOwner: false,
      isProjectOwner: true
    }),
    false
  );
  assert.equal(
    shouldShowStandaloneBuildProjectLumineFix({
      hasLumineFix: false,
      isCurrentBuildOwner: false,
      isProjectOwner: false
    }),
    false
  );
});

test('the editor applies canonical repair events and wires the teammate control into Team', () => {
  const hookSource = readFileSync(
    new URL(
      '../src/containers/Build/Editor/hooks/useBranchMainLumineFix.ts',
      import.meta.url
    ),
    'utf8'
  );
  const editorSource = readFileSync(
    new URL('../src/containers/Build/Editor/index.tsx', import.meta.url),
    'utf8'
  );
  const collaborationPanelSource = readFileSync(
    new URL(
      '../src/containers/Build/Editor/CollaborationPanel/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const handleFixUpdateStart = hookSource.indexOf(
    'function handleFixUpdate(payload: any)'
  );
  const handleFixUpdateEnd = hookSource.indexOf(
    "socket.on('connect', refresh)",
    handleFixUpdateStart
  );
  const handleFixUpdateSource = hookSource.slice(
    handleFixUpdateStart,
    handleFixUpdateEnd
  );

  assert(handleFixUpdateStart > 0 && handleFixUpdateEnd > handleFixUpdateStart);
  assert.match(handleFixUpdateSource, /applyCanonicalState\(payload\);/);
  assert.doesNotMatch(handleFixUpdateSource, /\brefresh\(\);/);
  assert.match(
    editorSource,
    /contributionBuildId:\s*projectLumineFixScope\.openContributionBuildId/
  );
  assert.match(
    hookSource,
    /loadBuildContributionLumineFix\([\s\S]*?stateOnly:\s*true/
  );
  assert.match(editorSource, /:\s*standaloneProjectLumineFixNoticeControl;/);
  assert.match(
    collaborationPanelSource,
    /if \(!isContributionFork\)[\s\S]*?renderStandaloneProjectLumineFixNotice\(\)/
  );
});

test('an unresolved Main Lumine fix replaces Update from Main', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: true,
    lumineFixStatus: 'needs_resolution',
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: 'Main needs a Lumine fix before this branch can update.'
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: false,
    error: '',
    showLumineFix: true,
    lumineFixBlocksBranchSync: true,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });
});

test('the branch notice renders the shared Sponsor Lumine action in product language', () => {
  const markup = renderToStaticMarkup(
    React.createElement(BranchMainUpdateNotice, {
      canUpdate: false,
      lumineFixBlocksBranchSync: true,
      lumineFixControl: {
        fix: {
          status: 'needs_resolution',
          conflictPaths: ['/app.js'],
          errorMessage: 'Resolve conflict markers in /app.js.'
        },
        details: null,
        selectedModel: '',
        loading: '',
        error: '',
        canSponsor: true,
        onOpenSponsor() {},
        onSelectModel() {},
        onSponsor() {}
      },
      onUpdate() {}
    })
  );

  assert.match(markup, /Main needs a quick fix/);
  assert.match(markup, /Sponsor Lumine Fix/);
  assert.doesNotMatch(markup, /Update from Main/);
  assert.doesNotMatch(markup, /app\.js|conflict markers/i);
});

test('a clean canonical Main state exposes Update from Main after checking', () => {
  const checking = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: true,
    hasLumineFix: false,
    lumineFixStatus: '',
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: ''
  });
  const ready = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: false,
    lumineFixStatus: '',
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: ''
  });

  assert.deepEqual(checking, {
    shown: false,
    canUpdate: false,
    error: '',
    showLumineFix: false,
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });
  assert.deepEqual(ready, {
    shown: true,
    canUpdate: true,
    error: '',
    showLumineFix: false,
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });
});

test('canonical Lumine completion clears the obsolete Main-fix error', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: false,
    lumineFixStatus: '',
    lumineFixWasApplied: true,
    branchHasConflictMarkers: false,
    updateError: 'Main needs a Lumine fix before this branch can update.'
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: true,
    error: '',
    showLumineFix: false,
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });
});

test('branch-local overlap remains blocked after Main is fixed', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: false,
    lumineFixStatus: '',
    lumineFixWasApplied: true,
    branchHasConflictMarkers: true,
    updateError: 'Main needs a Lumine fix before this branch can update.'
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: false,
    error: '',
    showLumineFix: false,
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: true
  });

  const markup = renderToStaticMarkup(
    React.createElement(BranchMainUpdateNotice, {
      canUpdate: state.canUpdate,
      error: state.error,
      branchLumineFixControl: {
        loading: false,
        onFix() {}
      },
      onUpdate() {}
    })
  );
  assert.match(markup, /Fix with Lumine/);
  assert.doesNotMatch(markup, /conflict markers|\/app\.js/i);
});

test('a branch-local overlap uses the shared notice action only once', () => {
  const input = {
    ownerReview: false,
    contributionStatus: 'draft',
    canAskLumineToResolveConflicts: true,
    activeConflictMarkerCount: 1
  };

  assert.equal(
    shouldShowStandaloneBranchLumineFixAction({
      ...input,
      hasNoticeLumineFixAction: true
    }),
    false
  );
  assert.equal(
    shouldShowStandaloneBranchLumineFixAction({
      ...input,
      hasNoticeLumineFixAction: false
    }),
    true
  );
});

test('a stale Lumine record cannot block syncing a canonically resolved Main', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: true,
    lumineFixStatus: 'stale',
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: 'Main needs a Lumine fix before this branch can update.'
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: true,
    error: '',
    showLumineFix: true,
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });

  const markup = renderToStaticMarkup(
    React.createElement(BranchMainUpdateNotice, {
      canUpdate: state.canUpdate,
      error: state.error,
      lumineFixBlocksBranchSync: state.lumineFixBlocksBranchSync,
      lumineFixControl: {
        fix: { status: 'stale', blocksBranchSync: false },
        details: null,
        selectedModel: '',
        loading: '',
        error: '',
        canSponsor: true,
        onOpenSponsor() {},
        onSelectModel() {},
        onSponsor() {}
      },
      onUpdate() {}
    })
  );
  assert.match(markup, /Update from Main/);
  assert.match(markup, /Sponsor Lumine Fix/);
  assert.doesNotMatch(markup, /Main needs a quick fix/);
});

test('canonical Main markers keep a stale legacy repair sponsorable', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: true,
    lumineFixStatus: 'stale',
    lumineFixBlocksBranchSync: true,
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: ''
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: false,
    error: '',
    showLumineFix: true,
    lumineFixBlocksBranchSync: true,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });
});

test('a noncanonical pending merge does not block another branch from safe Main', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: true,
    lumineFixStatus: 'needs_resolution',
    lumineFixBlocksBranchSync: false,
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: ''
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: true,
    error: '',
    showLumineFix: true,
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: false,
    showBranchLumineFix: false
  });

  const markup = renderToStaticMarkup(
    React.createElement(BranchMainUpdateNotice, {
      canUpdate: state.canUpdate,
      lumineFixBlocksBranchSync: state.lumineFixBlocksBranchSync,
      lumineFixControl: {
        fix: { status: 'needs_resolution', blocksBranchSync: false },
        details: null,
        selectedModel: '',
        loading: '',
        error: '',
        canSponsor: true,
        onOpenSponsor() {},
        onSelectModel() {},
        onSponsor() {}
      },
      onUpdate() {}
    })
  );

  assert.match(markup, /A team branch is waiting for Lumine/);
  assert.match(markup, /Sponsor Lumine Fix/);
  assert.match(markup, /Update from Main/);
});

test('the originating branch keeps Sponsor Lumine and cannot update mid-merge', () => {
  const state = resolveBranchMainUpdateNoticeState({
    rootDrifted: true,
    fixChecking: false,
    hasLumineFix: true,
    lumineFixStatus: 'needs_resolution',
    lumineFixBlocksBranchSync: false,
    lumineFixTargetsCurrentBranch: true,
    lumineFixWasApplied: false,
    branchHasConflictMarkers: false,
    updateError: ''
  });

  assert.deepEqual(state, {
    shown: true,
    canUpdate: false,
    error: '',
    showLumineFix: true,
    lumineFixBlocksBranchSync: true,
    lumineFixTargetsCurrentBranch: true,
    showBranchLumineFix: false
  });

  const markup = renderToStaticMarkup(
    React.createElement(BranchMainUpdateNotice, {
      canUpdate: state.canUpdate,
      lumineFixBlocksBranchSync: state.lumineFixBlocksBranchSync,
      lumineFixTargetsCurrentBranch: state.lumineFixTargetsCurrentBranch,
      lumineFixControl: {
        fix: { status: 'needs_resolution', blocksBranchSync: false },
        details: null,
        selectedModel: '',
        loading: '',
        error: '',
        canSponsor: true,
        onOpenSponsor() {},
        onSelectModel() {},
        onSponsor() {}
      },
      onUpdate() {}
    })
  );

  assert.match(markup, /This branch is waiting for Lumine/);
  assert.match(markup, /Sponsor Lumine Fix/);
  assert.doesNotMatch(markup, /Update from Main|fix Main/i);
});
