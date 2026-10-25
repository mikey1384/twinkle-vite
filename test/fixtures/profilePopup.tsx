import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser, faCardsBlank, faComment, faUserPlus, faUserCheck, faClock } from '@fortawesome/pro-solid-svg-icons';
import { FixtureProvider } from '~/contexts';
import UsernameText from '~/components/Texts/UsernameText';
import UserPopup from '~/components/UserPopup';
import UserReducer from '~/contexts/User/reducer';
import usePlatinumCover from '~/containers/Profile/usePlatinumCover';
import { withLoadedProfileAppearance } from '~/helpers/profileAppearance';
import { achievementTypeToId } from '~/constants/defaultValues';

library.add(faUser, faCardsBlank, faComment, faUserPlus, faUserCheck, faClock);
const achievementsObj = Object.fromEntries(['gold', 'mission', 'summoner', 'grammar', 'mentor'].map(type => [type, {type, title:type}]));
const ids = Object.keys(achievementsObj).map(type => achievementTypeToId[type]);
const realNow = Date.now;
let clockOffset = 0;
Date.now = () => realNow() + clockOffset;
window.advanceProfileClock = ms => { clockOffset += ms; };
window.auditReducer = UserReducer;

function CoverHarness({user}: {user: {id: number; [key: string]: any}}) {
  const cover = usePlatinumCover(user);
  window.saveCoverSettings = cover.saveSettings;
  window.coverError = cover.error;
  return null;
}

function Fixture() {
  const [config, setConfig] = useState<any>(null);
  const [userState, setUserState] = useState<any>({myState:{userId:1}, userObj:{}, achievementsObj});
  const [revision, setRevision] = useState(0);
  window.setCase = next => {
    window.profileFetches = 0;
    window.failNextProfile = !!next.fail;
    const cache = next.cache ? {
      ...next.cache, unlockedAchievementIds:ids,
      ...(next.cacheFresh === false ? {} : {
        profileAppearanceLoadedAt:Date.now(),
        profileAppearanceRequestStartedAt:Date.now()-1
      })
    } : null;
    setUserState({myState:{userId:next.viewerId || 1}, userObj:cache ? {[next.user.id]:cache} : {}, achievementsObj});
    setConfig({...next, user:{...next.user,unlockedAchievementIds:ids}, response:{...next.response,unlockedAchievementIds:ids}});
    setRevision(value => value + 1);
  };
  const onSetUserState = action => setUserState(previous => UserReducer(previous, {type:'SET_USER_STATE', ...action}));
  window.patchCache = newState => onSetUserState({userId:config.user.id, newState});
  window.auditUserState = userState;
  const context = {
    user:{state:userState, actions:{onSetUserState}},
    requestHelpers:{
      loadProfile:async () => {
        const requestedAt = Date.now();
        window.profileFetches++;
        const response = structuredClone(config.response);
        if (config.defer) await new Promise(resolve => {window.finishProfileRequest=resolve;});
        else await new Promise(resolve => setTimeout(resolve, 40));
        if(window.failNextProfile) { window.failNextProfile=false; throw Error('Synthetic profile failure'); }
        return withLoadedProfileAppearance(response, requestedAt);
      },
      updateProfileCoverSettings:() => new Promise((resolve,reject) => {window.finishCoverSave=resolve;window.failCoverSave=reject;}),
      loadFriendStatus:async () => ({eligible:true,state:'friends'}),
      addFriend:async () => {throw Error('Fixture forbids writes');},
      removeFriend:async () => {throw Error('Fixture forbids writes');},
      reportError:error => {throw Error(JSON.stringify(error));}
    }
  };
  return <FixtureProvider value={context}><MemoryRouter><main>
    <h1>Platinum popup regression checks</h1>
    <p data-case-label>{config?.name || 'Preparing fixture'}</p>
    {config && <div key={revision} style={{marginTop:30,fontSize:'1.8rem'}}>
      <CoverHarness user={config.user}/>
      {config.direct
        ? <UserPopup myId={1} user={config.user} popupContext={{x:32,y:120,width:180,height:24}}
            onHide={()=>{}} onMouseEnter={()=>{}} onMouseLeave={()=>{}} onSetPopupContext={()=>{}} />
        : <div data-trigger><UsernameText user={config.user} /> started a subject</div>}
    </div>}
  </main></MemoryRouter></FixtureProvider>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
