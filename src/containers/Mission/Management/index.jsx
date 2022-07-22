import React from 'react';
import PropTypes from 'prop-types';
import Attempts from './Attempts';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

Management.propTypes = {
  attemptObj: PropTypes.object,
  managementObj: PropTypes.object,
  selectedTab: PropTypes.string,
  onSelectTab: PropTypes.func.isRequired,
  onSetAttemptObj: PropTypes.func.isRequired,
  onSetManagementObj: PropTypes.func.isRequired
};

export default function Management({
  attemptObj,
  managementObj,
  selectedTab,
  onSelectTab,
  onSetAttemptObj,
  onSetManagementObj
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
