import React from 'react';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import SideMenu from '~/components/SideMenu';

const missionsLabel = localize('missions2');
const manageLabel = localize('manage');

export default function RightMenu({
  className,
  selectedTab,
  onSelectTab,
  style,
  positionMode
}: {
  className?: string;
  selectedTab: string;
  onSelectTab: (arg: string) => any;
  style?: React.CSSProperties;
  positionMode?: 'fixed' | 'sticky' | 'static';
}) {
  return (
    <SideMenu
      variant="card"
      placement="right"
      positionMode={positionMode}
      className={className}
      style={style}
    >
      <nav
        className={selectedTab === 'missions' ? 'active' : ''}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'left',
          width: '100%'
        }}
        onClick={() => onSelectTab('missions')}
      >
        <Icon icon="clipboard-check" />
        <span style={{ marginLeft: '1.1rem' }}>{missionsLabel}</span>
      </nav>
      <nav
        className={selectedTab === 'management' ? 'active' : ''}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'left',
          width: '100%'
        }}
        onClick={() => onSelectTab('management')}
      >
        <Icon icon="user-group-crown" />
        <span style={{ marginLeft: '1.1rem' }}>{manageLabel}</span>
      </nav>
    </SideMenu>
  );
}
