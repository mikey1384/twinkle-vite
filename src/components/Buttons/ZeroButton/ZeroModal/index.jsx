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
  modalOverModal: PropTypes.bool
};
export default function ZeroModal({
  contentId,
  contentType,
  onHide,
  modalOverModal
}) {
  const { content } = useContentState({ contentId, contentType });

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
            display: flex;
            > .menu {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              width: 60%;
            }
            > .content {
              width: 40%;
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
            <Menu content={content} />
          </div>
          <div className="content">{content}</div>
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
