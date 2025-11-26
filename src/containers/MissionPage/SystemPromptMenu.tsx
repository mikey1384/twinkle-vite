import React from 'react';
import Icon from '~/components/Icon';
import SideMenu from '~/components/SideMenu';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SystemPromptMenu({
  className,
  missionType,
  missionCleared,
  style
}: {
  className?: string;
  missionType: string;
  missionCleared?: boolean;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/missions/${missionType}`;

  const isMission = location.pathname === basePath;
  const isWorkshop = location.pathname === `${basePath}/workshop`;
  const isShared = location.pathname === `${basePath}/shared`;

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
        className={isMission ? 'active' : ''}
        onClick={() => navigate(basePath)}
        style={navStyle}
      >
        <Icon icon="clipboard-check" />
        <span style={{ marginLeft: '1.1rem' }}>Mission</span>
      </nav>
      {missionCleared && (
        <nav
          className={isWorkshop ? 'active' : ''}
          onClick={() => navigate(`${basePath}/workshop`)}
          style={navStyle}
        >
          <Icon icon="wand-magic-sparkles" />
          <span style={{ marginLeft: '1.1rem' }}>Workshop</span>
        </nav>
      )}
      <nav
        className={isShared ? 'active' : ''}
        onClick={() => navigate(`${basePath}/shared`)}
        style={navStyle}
      >
        <Icon icon="copy" />
        <span style={{ marginLeft: '1.1rem' }}>Shared Prompts</span>
      </nav>
    </SideMenu>
  );
}

const navStyle: React.CSSProperties = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  textAlign: 'left',
  width: '100%'
};
