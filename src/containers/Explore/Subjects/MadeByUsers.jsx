import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import ContentListItem from '~/components/ContentListItem';
import { useAppContext, useExploreContext } from '~/contexts';
import localize from '~/constants/localize';

const madeByUsersLabel = localize('madeByUsers');
const noUserMadeContentLabel = localize('noUserMadeContent');

MadeByUsers.propTypes = {
  expanded: PropTypes.bool,
  loaded: PropTypes.bool,
  loadMoreButton: PropTypes.bool,
  onExpand: PropTypes.func.isRequired,
  subjects: PropTypes.array,
  style: PropTypes.object
};

export default function MadeByUsers({
  expanded,
  loaded,
  loadMoreButton,
  onExpand,
  subjects,
  style
}) {
  const loadByUserUploads = useAppContext(
    (v) => v.requestHelpers.loadByUserUploads
  );
  const onLoadMoreByUserSubjects = useExploreContext(
    (v) => v.actions.onLoadMoreByUserSubjects
  );
  const shownSubjects = useMemo(() => {
    if (expanded) {
      return subjects;
    }
    return subjects[0] ? [subjects[0]] : [];
  }, [subjects, expanded]);

  return (
    <ErrorBoundary componentPath="Explore/Subjects/MadeByUsers">
      <SectionPanel
        style={style}
        title={madeByUsersLabel}
        loadMoreButtonShown={
          (!expanded && subjects.length > 1) || loadMoreButton
        }
        onLoadMore={handleLoadMore}
        isEmpty={subjects.length === 0}
        emptyMessage={noUserMadeContentLabel}
        loaded={loaded}
      >
        {shownSubjects.map((subject) => (
          <ContentListItem
            key={subject.id}
            style={{ marginBottom: '1rem' }}
            contentObj={subject}
          />
        ))}
      </SectionPanel>
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    if (!expanded) {
      return onExpand();
    }
    const { results, loadMoreButton: loadMoreButtonShown } =
      await loadByUserUploads({
        contentType: 'subject',
        limit: 10,
        lastId: subjects[subjects.length - 1].id
      });
    onLoadMoreByUserSubjects({
      subjects: results,
      loadMoreButton: loadMoreButtonShown
    });
  }
}
