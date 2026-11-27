import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { buildListTabRoutes } from './List/helpers/url';

const BuildEditorRoute = lazyWithRetry(() => import('./EditorRoute'));
const DomainCheckoutRoute = lazyWithRetry(() => import('./DomainCheckoutRoute'));
const BuildList = lazyWithRetry(() => import('./List'));
const New = lazyWithRetry(() => import('./New'));

export default function Build() {
  return (
    <ErrorBoundary componentPath="Build">
      <div
        className={css`
          height: 100%;
          min-height: 0;
        `}
      >
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<BuildList />} />
            <Route path="/new" element={<New />} />
            {buildListTabRoutes.map(({ path, tab, browseMode }) => (
              <Route
                key={path}
                path={path}
                element={<BuildList tab={tab} browseMode={browseMode} />}
              />
            ))}
            {/* the own-web-address checkout, its own page (before the
                branch route, which would read "domain" as a branch) */}
            <Route path="/:buildId/domain" element={<DomainCheckoutRoute />} />
            <Route
              path="/:buildId/:branchNumber"
              element={<BuildEditorRoute />}
            />
            <Route path="/:buildId" element={<BuildEditorRoute />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
