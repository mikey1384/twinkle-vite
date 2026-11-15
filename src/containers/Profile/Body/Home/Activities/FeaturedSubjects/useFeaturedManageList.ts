import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { profileFeaturedItemKey } from '~/helpers/profileFeatured';

// The owner's Select and Reorder windows edit the whole stored Featured list,
// not only what shows on the profile: entries the owner can't open right now
// come back as { unavailable: true } so saving never drops them unseen. The
// revision goes with the save; if the list changed elsewhere meanwhile (another
// tab, the comment menu) the server refuses the save and the window reloads.
export interface FeaturedManageList {
  loaded: boolean;
  items: any[];
  keys: string[];
  revision: string;
  // bumps on every (re)load, so a window can reset its edits to the new list
  version: number;
  loadError: string;
}

export const FEATURED_STALE_CODE = 'PROFILE_FEATURED_STALE';

export function useFeaturedManageList() {
  const loadManageList = useAppContext(
    (v) => v.requestHelpers.loadMyProfileFeaturedManageList
  );
  const [state, setState] = useState<FeaturedManageList>({
    loaded: false,
    items: [],
    keys: [],
    revision: '',
    version: 0,
    loadError: ''
  });
  const mountedRef = useRef(true);

  const reload = useCallback(async () => {
    try {
      const data = await loadManageList();
      if (!mountedRef.current) return;
      const items = Array.isArray(data?.items) ? data.items : [];
      setState((current) => ({
        loaded: true,
        items,
        keys: Array.from(new Set(items.map(profileFeaturedItemKey))),
        revision: String(data?.revision || ''),
        version: current.version + 1,
        loadError: ''
      }));
    } catch (error: any) {
      if (!mountedRef.current) return;
      setState((current) => ({
        ...current,
        loadError: error?.message || "Couldn't load your Featured list."
      }));
    }
  }, [loadManageList]);

  useEffect(() => {
    mountedRef.current = true;
    reload();
    return () => {
      mountedRef.current = false;
    };
  }, [reload]);

  return { ...state, reload };
}
