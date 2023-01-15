import { useEffect } from 'react';
import PropTypes from 'prop-types';

SearchView.propTypes = {
  filters: PropTypes.object.isRequired
};

export default function SearchView({ filters }) {
  useEffect(() => {
    console.log(filters);
  }, [filters]);

  return (
    <div
      style={{
        marginTop: '3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      search view
    </div>
  );
}
