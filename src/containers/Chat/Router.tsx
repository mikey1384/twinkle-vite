import React, { Suspense } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import Loading from '~/components/Loading';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

const Main = lazyWithRetry(() => import('./Main'));

export default function Router({
  onFileUpload
}: {
  onFileUpload: (file: File) => void;
}) {
  const {
    currentPathId
  }: {
    currentPathId?: string;
  } = useParams();
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route
          path="/:subchannelPath/topic/:topicId"
          element={
            <Main onFileUpload={onFileUpload} currentPathId={currentPathId} />
          }
        />
        <Route
          path="/topic/:topicId"
          element={
            <Main onFileUpload={onFileUpload} currentPathId={currentPathId} />
          }
        />
        <Route
          path="/:subchannelPath"
          element={
            <Main onFileUpload={onFileUpload} currentPathId={currentPathId} />
          }
        />
        <Route
          path="/*"
          element={
            <Main onFileUpload={onFileUpload} currentPathId={currentPathId} />
          }
        />
      </Routes>
    </Suspense>
  );
}
