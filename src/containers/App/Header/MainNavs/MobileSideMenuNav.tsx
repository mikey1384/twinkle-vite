import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { useKeyContext } from '~/contexts';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';

export default function MobileSideMenuNav({
  alert,
  onClick
}: {
  alert: boolean;
  onClick: () => void;
}) {
  const viewerTheme =
    useKeyContext((v) => v.myState.profileTheme) || DEFAULT_PROFILE_THEME;
  const alertRole = useRoleColor('alert', {
    fallback: 'gold',
    themeName: viewerTheme
  });
  const alertHue = useMemo(
    () => alertRole.getColor() || Color.gold(),
    [alertRole]
  );
  const highlightColor = useMemo(
    () => (alert ? alertHue : Color.darkGray()),
    [alert, alertHue]
  );

  return (
    <div
      onClick={onClick}
      className={`mobile ${css`
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        .chat {
          color: ${Color.lightGray()};
        }
        nav {
          text-decoration: none;
          font-weight: bold;
          color: ${Color.lightGray()};
          align-items: center;
          line-height: 1;
        }
        > nav.active {
          color: ${highlightColor}!important;
          > svg {
            color: ${highlightColor}!important;
          }
        }
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            > nav {
              > svg {
                color: ${highlightColor};
              }
              color: ${highlightColor};
            }
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          justify-content: center;
          font-size: 3rem;
          nav {
            .nav-label {
              display: none;
            }
          }
          > nav.active {
            > svg {
              color: ${highlightColor};
            }
          }
        }
      `}`}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          ...(alert ? { color: alertHue } : {})
        }}
      >
        <Icon icon="bars" />
      </nav>
    </div>
  );
}
