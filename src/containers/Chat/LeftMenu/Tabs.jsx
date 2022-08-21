import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import { useChatContext } from '~/contexts';

export default function Tabs() {
  const favoriteChannelIds = useChatContext((v) => v.state.favoriteChannelIds);
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const selectedChatTab = useChatContext((v) => v.state.selectedChatTab);
  const onSelectChatTab = useChatContext((v) => v.actions.onSelectChatTab);
  if (!favoriteChannelIds?.length && !classChannelIds?.length) return null;

  return (
    <FilterBar
      style={{
        fontSize: '1.6rem',
        height: '4.5rem',
        marginBottom: '-1rem'
      }}
    >
      <nav
        className={selectedChatTab === 'home' ? 'active' : null}
        onClick={() => onSelectChatTab('home')}
      >
        <Icon icon="home" />
      </nav>
      {favoriteChannelIds.length > 0 && (
        <nav
          className={selectedChatTab === 'favorite' ? 'active' : null}
          onClick={() => onSelectChatTab('favorite')}
        >
          <Icon icon="star" />
        </nav>
      )}
      {classChannelIds.length > 0 && (
        <nav
          className={selectedChatTab === 'class' ? 'active' : null}
          onClick={() => onSelectChatTab('class')}
        >
          <Icon icon="chalkboard-teacher" />
        </nav>
      )}
    </FilterBar>
  );
}
