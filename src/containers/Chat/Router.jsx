import { Route, Routes, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Main from './Main';

Router.propTypes = {
  onFileUpload: PropTypes.func.isRequired
};

export default function Router({ onFileUpload }) {
  const { currentPathId } = useParams();
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
