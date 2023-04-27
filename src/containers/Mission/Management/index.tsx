import React from 'react';
import Attempts from './Attempts';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Management({
  attemptObj,
  managementObj,
  selectedTab,
  onSelectTab,
  onSetAttemptObj,
  onSetManagementObj
}: {
  attemptObj: Record<string, any>;
  managementObj: Record<string, any>;
  selectedTab: string;
  onSelectTab: (arg0: string) => void;
  onSetAttemptObj: (arg0: Record<string, any>) => void;
  onSetManagementObj: (arg0: Record<string, any>) => void;
}) {
  return (
    <ErrorBoundary
      componentPath="Mission/Management/index"
      className={css`
        width: CALC(100% - 12rem);
        margin-left: 6rem;
        margin-right: 6rem;
        margin-top: 1rem;
        margin-bottom: 10rem;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          margin-left: 0;
          margin-right: 0;
        }
      `}
    >
      <Attempts
        attemptObj={attemptObj}
        managementObj={managementObj}
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
        onSetAttemptObj={onSetAttemptObj}
        onSetManagementObj={onSetManagementObj}
      />
    </ErrorBoundary>
  );
}
