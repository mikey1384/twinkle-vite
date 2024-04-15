import React, { memo, useState } from 'react';
import AlertModal from '~/components/Modals/AlertModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProfileWidget from '~/components/ProfileWidget';
import HomeMenuItems from '~/components/HomeMenuItems';
import Notification from '~/components/Notification';
import People from './People';
import Earn from './Earn';
import Store from './Store';
import Stories from './Stories';
import LocalContext from './Context';
import AIStoriesModal from './AIStoriesModal';
import GrammarGameModal from './GrammarGameModal';
import Achievements from './Achievements';
import { useHomeContext } from '~/contexts';
import { container, Left, Center, Right } from './Styles';

function Home({
  onFileUpload,
  section
}: {
  onFileUpload?: (file: any) => void;
  section: string;
}) {
  const aiStoriesModalShown = useHomeContext(
    (v) => v.state.aiStoriesModalShown
  );
  const grammarGameModalShown = useHomeContext(
    (v) => v.state.grammarGameModalShown
  );
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const [alertModalShown, setAlertModalShown] = useState(false);

  return (
    <ErrorBoundary componentPath="Home/index">
      <LocalContext.Provider
        value={{
          onFileUpload
        }}
      >
        <div className={container}>
          <div className={Left}>
            <ProfileWidget />
            <HomeMenuItems style={{ marginTop: '1rem' }} />
          </div>
          <div className={Center}>
            <div style={{ maxWidth: '700px', width: '100%' }}>
              {section === 'people' && <People />}
              {section === 'earn' && <Earn />}
              {section === 'achievement' && <Achievements />}
              {section === 'store' && <Store />}
              {section === 'story' && <Stories />}
            </div>
          </div>
          <Notification trackScrollPosition className={Right} location="home" />
          {alertModalShown && (
            <AlertModal
              title="Image is too large (limit: 10mb)"
              content="Please select a smaller image"
              onHide={() => setAlertModalShown(false)}
            />
          )}
          {grammarGameModalShown && (
            <GrammarGameModal
              onHide={() => onSetGrammarGameModalShown(false)}
            />
          )}
          {aiStoriesModalShown && (
            <AIStoriesModal onHide={() => onSetAIStoriesModalShown(false)} />
          )}
        </div>
      </LocalContext.Provider>
    </ErrorBoundary>
  );
}

export default memo(Home);
