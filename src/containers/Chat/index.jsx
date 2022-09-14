import { Route, Routes } from 'react-router-dom';
import PropTypes from 'prop-types';
import Router from './Router';

Chat.propTypes = {
  onFileUpload: PropTypes.func.isRequired
};

export default function Chat({ onFileUpload }) {
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
