import { useState } from 'react';
import { useKeyContext } from '~/contexts';
import MyCollection from './MyCollection';
import Listed from './Listed';
import FilterBar from '~/components/FilterBar';

export default function CollectedCards() {
  const [activeTab, setActiveTab] = useState('myCollection');
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);

  return (
    <div style={{ width: '100%', height: '50%' }}>
      <FilterBar
        style={{ height: '4.5rem', fontSize: '1.5rem', marginBottom: 0 }}
      >
        <nav
          className={activeTab === 'myCollection' ? 'active' : ''}
          onClick={() => setActiveTab('myCollection')}
        >
          My Collections
        </nav>
        <nav
          className={activeTab === 'myListed' ? 'active' : ''}
          onClick={() => setActiveTab('myListed')}
        >
          Listed
        </nav>
      </FilterBar>
      <div style={{ height: '100%' }}>
        {activeTab === 'myCollection' ? (
          <MyCollection loadMoreButtonColor={loadMoreButtonColor} />
        ) : (
          <Listed loadMoreButtonColor={loadMoreButtonColor} />
        )}
      </div>
    </div>
  );
}
