import React, { Suspense } from 'react';
import Notification from '~/components/Notification';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { Route, Routes, useLocation } from 'react-router-dom';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

const Main = lazyWithRetry(() => import('./Main'));
const Tools = lazyWithRetry(() => import('./Tools'));
const ModActivities = lazyWithRetry(() => import('./ModActivities'));
const NotableUsers = lazyWithRetry(() => import('./NotableUsers'));
const AiCosts = lazyWithRetry(() => import('./AiCosts'));
const UserBuckets = lazyWithRetry(() => import('./UserBuckets'));
const Payment = lazyWithRetry(() => import('./Payment'));
const HomeFeedPerformance = lazyWithRetry(
  () => import('./HomeFeedPerformance')
);
const ScrollDiagnostics = lazyWithRetry(() => import('./ScrollDiagnostics'));
const BuildWorlds = lazyWithRetry(() => import('./BuildWorlds'));
const AiCards = lazyWithRetry(() => import('./AiCards'));

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
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="*" element={<Main />} />
            <Route path="tools" element={<Tools />} />
            <Route path="mod-activities" element={<ModActivities />} />
            <Route path="notable-users" element={<NotableUsers />} />
            <Route path="ai-costs" element={<AiCosts />} />
            <Route path="user-buckets" element={<UserBuckets />} />
            <Route path="payment" element={<Payment />} />
            <Route
              path="home-feed-performance"
              element={<HomeFeedPerformance />}
            />
            <Route
              path="scroll-diagnostics"
              element={<ScrollDiagnostics />}
            />
            <Route path="build-worlds" element={<BuildWorlds />} />
            <Route path="ai-card-image" element={<AiCards />} />
          </Routes>
        </Suspense>
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
