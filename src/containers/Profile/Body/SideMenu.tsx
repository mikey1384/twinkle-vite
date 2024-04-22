import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

SideMenu.propTypes = {
  className: PropTypes.string,
  menuItems: PropTypes.array.isRequired,
  onMenuClick: PropTypes.func.isRequired,
  selectedKey: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default function SideMenu({
  onMenuClick,
  menuItems,
  selectedKey,
  style
}: {
  className?: string;
  menuItems: { key: string; label: string }[];
  onMenuClick: (item: { item: string }) => void;
  selectedKey: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="desktop"
      style={{
        display: 'flex',
        marginLeft: '1rem',
        flexGrow: 1,
        maxWidth: '13rem',
        position: 'relative',
        flexDirection: 'column',
        ...style
      }}
    >
      <div
        className={css`
          position: -webkit-sticky;
          > nav {
            padding: 1rem;
            font-size: 2rem;
            font-weight: bold;
            color: ${Color.gray()};
            &:hover {
              color: ${Color.black()};
            }
          }
        `}
        style={{
          paddingLeft: '1rem',
          position: 'sticky',
          top: '1rem'
        }}
      >
        {menuItems.map(({ key, label }) => (
          <nav
            key={key}
            onClick={() => onMenuClick({ item: key })}
            style={{
              cursor: 'pointer',
              color: selectedKey === key ? Color.black() : ''
            }}
          >
            {label}
          </nav>
        ))}
      </div>
    </div>
  );
}
