import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Router from './Router';

export default function Chat({
  onFileUpload
}: {
  onFileUpload: (v: any) => void;
}) {
  return (
    <Routes>
      <Route
        path="/:currentPathId/*"
        element={<Router onFileUpload={onFileUpload} />}
      />
      <Route path="/*" element={<Router onFileUpload={onFileUpload} />} />
    </Routes>
  );
}
