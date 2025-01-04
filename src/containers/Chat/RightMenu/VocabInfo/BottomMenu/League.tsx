import React, { useState } from 'react';
import FilterBar from '~/components/FilterBar';

export default function League() {
  const [selected, setSelected] = useState('month');
  return (
    <div>
      <FilterBar
        style={{ fontSize: '1.5rem', height: '4rem', marginBottom: 0 }}
      >
        <nav
          onClick={() => setSelected('month')}
          className={selected === 'month' ? 'active' : ''}
        >
          January
        </nav>
        <nav
          onClick={() => setSelected('year')}
          className={selected === 'year' ? 'active' : ''}
        >
          2025
        </nav>
      </FilterBar>
    </div>
  );
}
