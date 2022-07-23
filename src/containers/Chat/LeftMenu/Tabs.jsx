import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';

export default function Tabs() {
  const favoriteChannelIds = useChatContext((v) => v.state.favoriteChannelIds);
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const selectedChatTab = useChatContext((v) => v.state.selectedChatTab);
  const onSelectChatTab = useChatContext((v) => v.actions.onSelectChatTab);

  return (
    <div
      style={{ width: '20%' }}
      className={css`
        padding: 0 1rem 1rem 1rem;
        > nav {
          cursor: pointer;
          width: 100%;
          height: 7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          > svg {
            font-size: 3rem;
          }
          @media (max-width: ${mobileMaxWidth}) {
            height: 5rem;
            > svg {
              font-size: 1.7rem;
            }
          }
        }
      `}
    >
      <nav
        style={{
          color: selectedChatTab === 'home' ? Color.black() : Color.gray()
        }}
        onClick={() => onSelectChatTab('home')}
      >
        <Icon icon="home" />
      </nav>
      {favoriteChannelIds.length > 0 && (
        <nav
          style={{
            color: selectedChatTab === 'favorite' ? Color.black() : Color.gray()
          }}
          onClick={() => onSelectChatTab('favorite')}
        >
          <Icon icon="star" />
        </nav>
      )}
      {classChannelIds.length > 0 && (
        <nav
          style={{
            color: selectedChatTab === 'class' ? Color.black() : Color.gray()
          }}
          onClick={() => onSelectChatTab('class')}
        >
          <Icon icon="chalkboard-teacher" />
        </nav>
      )}
    </div>
  );
}
