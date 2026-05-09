import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

const Content = lazyWithRetry(() => import('./Content'));

export default function ResetPassword() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="password/:token" element={<Content />} />
        <Route path="*" element={<InvalidPage />} />
      </Routes>
    </Suspense>
  );
}
