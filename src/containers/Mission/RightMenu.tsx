import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const missionsLabel = localize('missions2');
const manageLabel = localize('manage');

RightMenu.propTypes = {
  className: PropTypes.string,
  selectedTab: PropTypes.string,
  onSelectTab: PropTypes.func,
  style: PropTypes.object
};

export default function RightMenu({
  className,
  selectedTab,
  onSelectTab,
  style
}: {
  className?: string;
  selectedTab: string;
  onSelectTab: (arg: string) => any;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
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
            &.active {
              color: ${Color.black()};
            }
          }
        `}
        style={{
          textAlign: 'center',
          position: 'sticky',
          top: '1rem'
        }}
      >
        <nav
          className={selectedTab === 'missions' ? 'active' : ''}
          onClick={() => onSelectTab('missions')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon icon="clipboard-check" />
          <span style={{ marginLeft: '1.5rem' }}>{missionsLabel}</span>
        </nav>
        <nav
          onClick={() => onSelectTab('management')}
          className={selectedTab === 'management' ? 'active' : ''}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon icon="user-group-crown" />
          <span style={{ marginLeft: '1.5rem' }}>{manageLabel}</span>
        </nav>
      </div>
    </div>
  );
}
