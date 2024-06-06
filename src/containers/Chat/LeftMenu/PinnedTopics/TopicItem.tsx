import React from 'react';
import Icon from '~/components/Icon';

export default function TopicItem({
  icon,
  children,
  className,
  onClick
}: {
  icon: string;
  children: React.ReactNode;
  className: string;
  onClick: () => void;
}) {
  return (
    <nav
      style={{ display: 'flex', alignItems: 'center' }}
      className={className}
      onClick={onClick}
    >
      <Icon icon={icon} />
      <div
        style={{
          width: 'CALC(100% - 1rem)',
          marginLeft: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexGrow: 1
        }}
      >
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {children}
        </div>
      </div>
    </nav>
  );
}
