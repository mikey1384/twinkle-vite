import React from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import Main from './Main';

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
    <Routes>
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
  );
}
