import React from 'react';
import Icon from '~/components/Icon';
import SideMenu from '~/components/SideMenu';
import { useLocation, useNavigate } from 'react-router-dom';

export default function RightMenu({
  className,
  missionType,
  style
}: {
  className?: string;
  missionType: string;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <SideMenu
      variant="card"
      placement="right"
      positionMode="fixed"
      topOffset="CALC(50vh - 8rem)"
      rightOffset="1rem"
      className={className}
      style={style}
    >
      <nav
        className={
          location.pathname !== `/missions/${missionType}/manage` ? 'active' : ''
        }
        onClick={() => navigate(`/missions/${missionType}`)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'left',
          width: '100%'
        }}
      >
        <Icon icon="clipboard-check" />
        <span style={{ marginLeft: '1.1rem' }}>Mission</span>
      </nav>
      <nav
        onClick={() => navigate(`/missions/${missionType}/manage`)}
        className={
          location.pathname === `/missions/${missionType}/manage` ? 'active' : ''
        }
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'left',
          width: '100%'
        }}
      >
        <Icon icon="user-group-crown" />
        <span style={{ marginLeft: '1.1rem' }}>Manage</span>
      </nav>
    </SideMenu>
  );
}
