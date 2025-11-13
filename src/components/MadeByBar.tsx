import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

export default function MadeByBar({
  username,
  byUser = true,
  style,
  theme,
  contentType,
  filePath
}: {
  username?: string;
  byUser?: boolean;
  style?: React.CSSProperties;
  theme?: string;
  contentType?: string;
  filePath?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const appliedTheme = theme || (profileTheme as string);
  const byUserIndicatorRole = useRoleColor('byUserIndicator', {
    themeName: appliedTheme,
    fallback: appliedTheme || 'logoBlue'
  });
  const background = byUserIndicatorRole.getColor(
    byUserIndicatorRole.defaultOpacity ?? 0.8
  );
  const byUserIndicatorTextRole = useRoleColor('byUserIndicatorText', {
    themeName: appliedTheme,
    fallback: 'white'
  });
  const color = byUserIndicatorTextRole.getColor();

  const label = useMemo(() => {
    const verb = contentType === 'subject' && !filePath ? 'written' : 'made';
    return `This was ${verb} by ${username ?? ''}`;
  }, [username, contentType, filePath]);

  if (!byUser) return null;

  return (
    <div
      className={css`
        padding: 0.5rem 1rem;
        background: ${background};
        color: ${color};
        text-shadow: none;
        display: flex;
        width: 100%;
        justify-content: center;
        align-items: center;
        font-weight: 700;
        font-size: 1.4rem;
        border-radius: 0;
      `}
      style={style}
      aria-label="content-made-by-uploader"
    >
      <Icon icon="check-circle" style={{ marginRight: '0.5rem' }} />
      {label}
    </div>
  );
}
