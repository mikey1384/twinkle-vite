import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FixtureProvider } from '~/contexts';
import Cover from '~/containers/Profile/Cover';
import ProfileCovers from '~/containers/Management/ProfileCovers';

const original = {
  id: 42, username: 'PlatinumMember', realName: 'A member', profileTheme: 'platinum',
  profileCoverUrl: '/profile/42/a.jpg', profileCoverPosition: '23,71', profileCoverShine: true,
  twinkleXP: 110000000, unlockedAchievementIds: [], referrals: { count: 0 }
};
const other = { ...original, id: 43, username: 'AnotherMember', profileCoverUrl: '/profile/43/b.jpg' };
window.fixtureProfiles = { 42: original, 43: other };
window.removalCalls = [];
window.userUpdates = [];
window.deferredLoads = {};

function Fixture() {
  const [viewerId, setViewerId] = useState(5);
  window.setViewer = setViewerId;
  window.renderedViewerId = viewerId;
  const context = {
    myState: { userId: viewerId, profileTheme: 'logoBlue' },
    user: { state: {}, actions: { onSetUserState: value => window.userUpdates.push(value) } },
    requestHelpers: {
      searchUsers: async text => Object.values(window.fixtureProfiles)
        .filter((user: any) => user.username.toLowerCase().includes(text.toLowerCase())),
      loadProfile: async id => {
        if (window.deferLoads) await new Promise(resolve => { window.deferredLoads[id] = resolve; });
        return { ...window.fixtureProfiles[id] };
      },
      loadUserReferrals: async () => ({ count: 0 }),
      removeMemberProfileCover: (id, cover) => new Promise((resolve, reject) => {
        window.removalCalls.push({ id, cover });
        window.resolveRemoval = resolve; window.rejectRemoval = reject;
      })
    }
  };
  return <FixtureProvider value={context}>
    <div data-profile>
      <Cover profile={original} selectedTheme="platinum" onSelectTheme={() => {}} onSetTheme={async () => {}} />
    </div>
    <div data-management><ProfileCovers /></div>
  </FixtureProvider>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
