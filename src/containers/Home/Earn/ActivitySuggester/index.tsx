import React, { useMemo } from 'react';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';
import ScopedTheme from '~/theme/ScopedTheme';
import { useHomePanelVars } from '~/theme/useHomePanelVars';
import { homePanelClass } from '~/theme/homePanels';

export default function ActivitySuggester({
  style
}: {
  style?: React.CSSProperties;
}) {
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);
  const { panelVars, themeName } = useHomePanelVars(0.08, {
    neutralSurface: true
  });
  const combinedStyle = useMemo(() => {
    if (!style) return panelVars;
    return { ...panelVars, ...style };
  }, [panelVars, style]);

  return (
    <ScopedTheme
      theme={themeName}
      roles={['sectionPanel', 'sectionPanelText']}
      className={homePanelClass}
      style={combinedStyle}
    >
      {topMenuSection === 'start' ? (
        <StartMenu />
      ) : topMenuSection === 'subject' ? (
        <EarnXPFromSubjects />
      ) : topMenuSection === 'recommend' ? (
        <RecommendPosts />
      ) : (
        <RewardPosts />
      )}
    </ScopedTheme>
  );
}
