import React from 'react';
import Main from './Main';
import Notification from '~/components/Notification';
import ModActivities from './ModActivities';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { Route, Routes, useLocation } from 'react-router-dom';
import Tools from './Tools';

export default function ManagementRoutes({ className }: { className: string }) {
  const location = useLocation();
  return (
    <div className={className}>
      <div
        className={css`
          margin-top: 1rem;
          width: CALC(100vw - 54rem);
          margin-left: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            margin-left: 0;
            width: 100%;
          }
        `}
      >
        <Routes>
          <Route path="*" element={<Main />} />
          <Route path="tools" element={<Tools />} />
          <Route path="mod-activities" element={<ModActivities />} />
        </Routes>
      </div>
      <Notification
        className={css`
          width: 31rem;
          overflow-y: scroll;
          -webkit-overflow-scrolling: touch;
          right: 1rem;
          top: 4.5rem;
          bottom: 0;
          position: absolute;
          @media (max-width: ${mobileMaxWidth}) {
            display: none;
          }
        `}
        location={location.pathname.substring(1)}
      />
    </div>
  );
}
