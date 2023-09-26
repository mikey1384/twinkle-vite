import React, { useMemo } from 'react';

export default function UserTitle({
  userType,
  level,
  className,
  style
}: {
  style?: React.CSSProperties;
  userType: string;
  className?: string;
  level: number;
}) {
  const displayedUserTitle = useMemo(() => {
    if (userType) {
      return userType.includes('teacher')
        ? `teacher (lv${level})`
        : `${userType} (lv${level})`;
    }
    return level > 1 ? `level ${level}` : '';
  }, [level, userType]);

  return displayedUserTitle ? (
    <div className={className} style={style}>
      <span>{displayedUserTitle}</span>
    </div>
  ) : null;
}
