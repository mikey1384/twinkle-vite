import React from 'react';
import ComponentSideMenu from '~/components/SideMenu';
import Icon from '~/components/Icon';

export default function SideMenu({
  onMenuClick,
  menuItems,
  selectedKey,
  style,
  className
}: {
  className?: string;
  menuItems: { key: string; label: string }[];
  onMenuClick: (item: { item: string }) => void;
  selectedKey: string;
  style?: React.CSSProperties;
}) {
  return (
    <ComponentSideMenu
      variant="card"
      placement="right"
      positionMode="sticky"
      topOffset="1rem"
      style={{ ...style }}
      className={`${className ? `${className} ` : ''}desktop`}
    >
      {menuItems.map(({ key, label }) => (
        <nav
          key={key}
          className={selectedKey === key ? 'active' : ''}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'left',
            width: '100%'
          }}
          onClick={() => onMenuClick({ item: key })}
        >
          <Icon icon={getIconForKey(key)} />
          <span style={{ marginLeft: '1.1rem' }}>{label}</span>
        </nav>
      ))}
    </ComponentSideMenu>
  );
}

function getIconForKey(key: string) {
  switch (key) {
    case 'all':
      return 'list';
    case 'comment':
      return 'comments';
    case 'subject':
      return 'bolt';
    case 'aiStory':
      return 'sparkles';
    case 'video':
      return 'film';
    case 'url':
      return 'link';
    default:
      return 'list';
  }
}
