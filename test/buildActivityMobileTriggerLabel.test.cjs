const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const helpersModule = loadTypeScriptModule(
  path.resolve(__dirname, '../src/containers/Build/List/helpers/index.ts')
);
const {
  getBuildActivityMobileTriggerLabel,
  getCappedNewBuildActivityCount
} = helpersModule.exports;

const lastViewedPosition = {
  sourceRank: 2,
  sortId: 100,
  timeStamp: 1000
};

assert.equal(
  getBuildActivityMobileTriggerLabel(
    getCappedNewBuildActivityCount({
      activities: [
        activity({ sourceRank: 2, sortId: 100, timeStamp: 1000 }),
        activity({ sourceRank: 1, sortId: 999, timeStamp: 999 })
      ],
      lastViewedPosition
    })
  ),
  'Build Activity'
);

assert.equal(
  getBuildActivityMobileTriggerLabel(
    getCappedNewBuildActivityCount({
      activities: [activity({ sourceRank: 2, sortId: 101, timeStamp: 1000 })],
      lastViewedPosition
    })
  ),
  '1 new notification'
);

assert.equal(
  getBuildActivityMobileTriggerLabel(
    getCappedNewBuildActivityCount({
      activities: [
        activity({ sourceRank: 2, sortId: 101, timeStamp: 1000 }),
        activity({ sourceRank: 3, sortId: 1, timeStamp: 1000 }),
        activity({ sourceRank: 2, sortId: 100, timeStamp: 1000 }),
        activity({ sourceRank: 9, sortId: 1, timeStamp: 999 })
      ],
      lastViewedPosition
    })
  ),
  '2 new notifications'
);

assert.equal(
  getBuildActivityMobileTriggerLabel(
    getCappedNewBuildActivityCount({
      activities: [
        ...Array.from({ length: 10 }, (_, index) =>
          activity({ sourceRank: 2, sortId: 101 + index, timeStamp: 1000 })
        ),
        activityThatMustNotBeRead()
      ],
      lastViewedPosition
    })
  ),
  '10+ new notifications'
);

assert.equal(getBuildActivityMobileTriggerLabel(9), '9 new notifications');
assert.equal(getBuildActivityMobileTriggerLabel(10), '10+ new notifications');
assert.equal(getBuildActivityMobileTriggerLabel(0), 'Build Activity');

const useActivityPanelSource = readFileSync(
  path.resolve(
    __dirname,
    '../src/containers/Build/List/hooks/useActivityPanel.ts'
  ),
  'utf8'
);
const activityPanelSource = readFileSync(
  path.resolve(__dirname, '../src/containers/Build/ActivityPanel.tsx'),
  'utf8'
);
const activityPanelsSource = readFileSync(
  path.resolve(__dirname, '../src/containers/Build/List/ActivityPanels.tsx'),
  'utf8'
);

assert.match(useActivityPanelSource, /activities: allActivities/);
assert.match(useActivityPanelSource, /lastViewedPosition: allLastViewedPosition/);
assert.match(useActivityPanelSource, /mobileTriggerLabel/);
assert.match(activityPanelSource, /mobileTriggerLabel = 'Build Activity'/);
assert.match(activityPanelSource, /\{mobileTriggerLabel\}/);
assert.match(activityPanelsSource, /mobileTriggerLabel=\{mobileTriggerLabel\}/);

console.log('Build activity mobile trigger label verifier passed.');

function activity({ sourceRank, sortId, timeStamp }) {
  return {
    activitySortId: sortId,
    activitySourceRank: sourceRank,
    timeStamp
  };
}

function activityThatMustNotBeRead() {
  return {
    get activitySortId() {
      throw new Error('capped unread count read beyond the 10-item cap');
    },
    get activitySourceRank() {
      throw new Error('capped unread count read beyond the 10-item cap');
    },
    get timeStamp() {
      throw new Error('capped unread count read beyond the 10-item cap');
    }
  };
}

function loadTypeScriptModule(entryPoint) {
  const output = esbuild.buildSync({
    bundle: true,
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod = { exports: {} };
  const localRequire = createRequire(entryPoint);
  const compiled = new Function('require', 'module', 'exports', output);

  compiled(localRequire, mod, mod.exports);

  return mod;
}
