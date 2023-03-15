import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ZeroMessage from './ZeroMessage';
import Menu from './Menu';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ZeroModal.propTypes = {
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool,
  content: PropTypes.string
};
export default function ZeroModal({
  contentId,
  contentType,
  onHide,
  modalOverModal,
  content
}) {
  const { content: contentFetchedFromContext } = useContentState({
    contentId,
    contentType
  });

  return (
    <Modal
      closeWhenClickedOutside={false}
      large
      modalOverModal={modalOverModal}
      onHide={onHide}
    >
      <header>Zero</header>
      <main>
        <div
          className={css`
            width: 100%;
            display: flex;
            > .menu {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: center;
              flex-grow: 1;
            }
            > .content {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 50%;
            }
            @media (max-width: ${mobileMaxWidth}) {
              flex-direction: column;
              > .menu {
                width: 100%;
              }
              > .content {
                margin-top: 3rem;
                width: 100%;
              }
            }
          `}
        >
          <div className="menu">
            <ZeroMessage />
            <Menu
              style={{ marginTop: '2rem' }}
              content={content || contentFetchedFromContext}
            />
          </div>
          <div className="content">
            {`"${content || contentFetchedFromContext}"`}
          </div>
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
