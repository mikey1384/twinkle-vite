import React from 'react';
import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';

TopFilter.propTypes = {
  className: PropTypes.string,
  selectedFilter: PropTypes.string.isRequired
};

export default function TopFilter({ selectedFilter, className }) {
  const navigate = useNavigate();
  return (
    <FilterBar className={className} bordered>
      <nav
        onClick={() => navigate('/videos')}
        className={selectedFilter === 'videos' ? 'active' : ''}
      >
        Videos
      </nav>
      <nav
        onClick={() => navigate('/links')}
        className={selectedFilter === 'links' ? 'active' : ''}
      >
        Links
      </nav>
      <nav
        onClick={() => navigate('/subjects')}
        className={selectedFilter === 'subjects' ? 'active' : ''}
      >
        Subjects
      </nav>
    </FilterBar>
  );
}
