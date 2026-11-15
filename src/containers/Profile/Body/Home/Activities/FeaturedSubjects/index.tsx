import React, { useState, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentListItem from '~/components/ContentListItem';
import SectionPanel from '~/components/SectionPanel';
import SelectFeaturedSubjects from './SelectFeaturedSubjects';
import ReorderFeaturedSubjects from './ReorderFeaturedSubjects';
import Button from '~/components/Button';
import { useProfileContext, useKeyContext } from '~/contexts';
import {
  applyMyProfileFeaturedRefs,
  profileFeaturedItemKey,
  profileFeaturedRefsFromItems
} from '~/helpers/profileFeatured';

const emptyOwnLabel =
  'Feature your favorite subjects and comments to show them here';
const emptyVisitorLabel = 'Nothing featured yet';
const selectLabel = 'Select';
const reorderLabel = 'Reorder';

// Profile "Featured": subjects and the member's own comments in one list, in
// the order they chose (the section key stays featuredSubjects). Both kinds
// are ContentListItem cards, drawn at once from the canonical rows the profile
// loaded (GET /user/featured/items, read access already applied); a comment
// card adds a one-line "Reply on" naming what it was posted on.
export default function FeaturedSubjects({
  loaded,
  selectedTheme,
  items = [],
  username,
  userId
}: {
  loaded: boolean;
  selectedTheme: string;
  items: any[];
  username: string;
  userId: number;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const isOwnProfile = myId === userId;
  const [reorderModalShown, setReorderModalShown] = useState(false);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const onSetFeaturedSubjects = useProfileContext(
    (v) => v.actions.onSetFeaturedSubjects
  );
  const shownItems = useMemo(() => {
    if (isExpanded) {
      return items;
    }
    return items.length > 0 ? items.slice(0, 3) : [];
  }, [items, isExpanded]);

  return (
    <ErrorBoundary componentPath="Explore/Subjects/Featured">
      <SectionPanel
        elevated
        title="Featured"
        loaded={loaded}
        loadMoreButtonShown={!isExpanded && items.length > 3}
        onLoadMore={() => setIsExpanded(true)}
        customColorTheme={selectedTheme}
        button={
          isOwnProfile ? (
            <div style={{ display: 'flex' }}>
              <Button
                variant="solid"
                tone="raised"
                color="darkerGray"
                disabled={!loaded}
                style={{ marginLeft: 'auto' }}
                onClick={() => setSelectModalShown(true)}
              >
                {selectLabel}
              </Button>
              <Button
                variant="solid"
                tone="raised"
                color="darkerGray"
                disabled={!loaded}
                style={{ marginLeft: '1rem' }}
                onClick={() => setReorderModalShown(true)}
              >
                {reorderLabel}
              </Button>
            </div>
          ) : null
        }
        isEmpty={items.length === 0}
        emptyMessage={isOwnProfile ? emptyOwnLabel : emptyVisitorLabel}
      >
        {shownItems.map((item: any) => (
          <div
            key={profileFeaturedItemKey(item)}
            data-scroll-anchor-id={`profile-featured-${
              item.contentType === 'comment' ? 'comment' : 'subject'
            }:${item.id}`}
            data-scroll-anchor-secondary-id={
              item.contentType === 'comment' ? undefined : String(item.id)
            }
            data-scroll-anchor-content-key={profileFeaturedItemKey(item)}
          >
            <ContentListItem
              style={{ marginBottom: '1rem' }}
              contentObj={item}
              showCommentContext
            />
          </div>
        ))}
      </SectionPanel>
      {selectModalShown && (
        <SelectFeaturedSubjects
          items={items}
          onHide={() => setSelectModalShown(false)}
          onSubmit={handleSaved}
        />
      )}
      {reorderModalShown && (
        <ReorderFeaturedSubjects
          items={items}
          onHide={() => setReorderModalShown(false)}
          onSubmit={handleSaved}
        />
      )}
    </ErrorBoundary>
  );

  // Both windows hand back the server's canonical list after saving.
  function handleSaved({ items: savedItems, refs }: { items: any[]; refs?: any[] }) {
    onSetFeaturedSubjects({ username, subjects: savedItems });
    applyMyProfileFeaturedRefs(
      myId,
      Array.isArray(refs) ? refs : profileFeaturedRefsFromItems(savedItems)
    );
    setSelectModalShown(false);
    setReorderModalShown(false);
  }
}
