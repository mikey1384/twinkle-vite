import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import { Color, getThemeStyles } from '~/constants/css';
import { getColorFromName } from '~/helpers/stringHelpers';
import { useHomeContext } from '~/contexts/hooks';
import { useKeyContext } from '~/contexts';

export default function RecentGroupItem({
  groupName,
  thumbPath
}: {
  groupName: string;
  thumbPath: string;
}) {
  const navigate = useNavigate();
  const bgColor = useMemo(() => getColorFromName(groupName), [groupName]);
  const onResetGroups = useHomeContext((v) => v.actions.onResetGroups);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = (profileTheme || 'logoBlue') as string;
  const hoverBg = useMemo(
    () => getThemeStyles(themeName, 0.08).bg,
    [themeName]
  );
  const homeMenuItemActive = useKeyContext(
    (v) => v.theme.homeMenuItemActive.color
  );
  const activeColorFn = useMemo(() => {
    const candidate = Color[homeMenuItemActive as keyof typeof Color];
    return typeof candidate === 'function'
      ? (candidate as (opacity?: number) => string)
      : null;
  }, [homeMenuItemActive]);
  const hoverAccentColor = useMemo(
    () => (activeColorFn ? activeColorFn() : Color.logoBlue()),
    [activeColorFn]
  );
  const hoverBorderColor = useMemo(
    () => (activeColorFn ? activeColorFn(0.35) : Color.borderGray()),
    [activeColorFn]
  );

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.4rem 1rem 0.4rem 2.2rem;
        margin: 0.2rem 1rem;
        border-radius: 0.8rem;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.35);
        box-shadow: none;
        cursor: pointer;
        transition: background 0.2s ease,
          border-color 0.2s ease, transform 0.15s ease;
        &:hover {
          background: ${hoverBg};
          border-color: ${hoverBorderColor};
          box-shadow: none;
          transform: translateX(3px);
          > span { color: ${hoverAccentColor}; }
          > div { border-color: ${hoverBorderColor}; }
        }
      `}
      onClick={() => {
        onResetGroups();
        navigate('/groups');
      }}
    >
      <div
        className={css`
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 50%;
          margin-right: 0.8rem;
          flex-shrink: 0;
          background-color: ${thumbPath ? Color.lightGray() : bgColor};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.35);
        `}
      >
        {thumbPath ? (
          <img
            src={`${cloudFrontURL}/thumbs/${thumbPath}/thumb.png`}
            alt={groupName}
            loading="lazy"
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <div
            className={css`
              font-size: 1rem;
              font-weight: bold;
              color: white;
              font-family: 'Roboto', sans-serif;
            `}
          >
            {groupName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span
        className={css`
          font-size: 1.1rem;
          color: ${Color.darkerGray()};
          flex-grow: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
        title={groupName}
      >
        {groupName}
      </span>
    </div>
  );
}
