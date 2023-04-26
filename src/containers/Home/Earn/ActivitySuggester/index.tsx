import React from 'react';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';

export default function ActivitySuggester({
  style
}: {
  style: React.CSSProperties;
}) {
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);

  return (
    <div style={style} className={panel}>
      {topMenuSection === 'start' ? (
        <StartMenu />
      ) : topMenuSection === 'subject' ? (
        <EarnXPFromSubjects />
      ) : topMenuSection === 'recommend' ? (
        <RecommendPosts />
      ) : (
        <RewardPosts />
      )}
    </div>
  );
}
