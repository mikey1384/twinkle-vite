import React from 'react';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';

export default function TopFilter({
  selectedFilter,
  className
}: {
  selectedFilter: string;
  className: string;
}) {
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
