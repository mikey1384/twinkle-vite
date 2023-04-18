import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import InnerContent from './InnerContent';

export default function Likers({
  likes,
  target,
  userId,
  onLinkClick,
  style = {},
  className,
  defaultText,
  theme,
  wordBreakEnabled
}: {
  likes?: any[];
  target?: string;
  userId: number;
  onLinkClick?: (e: any) => void;
  style?: React.CSSProperties;
  className?: string;
  defaultText?: string;
  theme?: string;
  wordBreakEnabled?: boolean;
}) {
  return (
    <ErrorBoundary componentPath="Likers/index">
      <div style={style} className={className}>
        <InnerContent
          defaultText={defaultText}
          likes={likes}
          onLinkClick={onLinkClick}
          target={target}
          userId={userId}
          theme={theme}
          wordBreakEnabled={wordBreakEnabled}
        />
      </div>
    </ErrorBoundary>
  );
}
