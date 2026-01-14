import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';

const EXPLORE_CATEGORIES = ['ai-cards', 'videos', 'links', 'subjects'] as const;

export default function ExploreRedirect() {
  const navigate = useNavigate();
  const searchFilter = useKeyContext((v) => v.myState.searchFilter);

  useEffect(() => {
    // If user has a default search filter set, use it
    if (searchFilter && EXPLORE_CATEGORIES.includes(searchFilter)) {
      navigate(`/${searchFilter}`, { replace: true });
    } else {
      // Otherwise, randomly pick one of the 4 categories
      const randomIndex = Math.floor(Math.random() * EXPLORE_CATEGORIES.length);
      navigate(`/${EXPLORE_CATEGORIES[randomIndex]}`, { replace: true });
    }
  }, [navigate, searchFilter]);

  return null;
}
