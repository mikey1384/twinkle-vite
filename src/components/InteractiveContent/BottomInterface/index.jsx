import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AddSlide from './AddSlide';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';

BottomInterface.propTypes = {
  className: PropTypes.string,
  interactiveId: PropTypes.number.isRequired,
  isPublished: PropTypes.bool,
  lastFork: PropTypes.object,
  archivedSlides: PropTypes.array,
  onPublishInteractive: PropTypes.func,
  style: PropTypes.object
};

export default function BottomInterface({
  archivedSlides,
  className,
  interactiveId,
  isPublished,
  lastFork,
  onPublishInteractive,
  style
}) {
  const publishInteractive = useAppContext(
    (v) => v.requestHelpers.publishInteractive
  );
  return (
    <div className={className} style={{ width: '100%', ...style }}>
      <AddSlide
        archivedSlides={archivedSlides}
        interactiveId={interactiveId}
        lastFork={lastFork}
      />
      {!isPublished && (
        <div
          className={css`
            background: #fff;
            margin-top: 3rem;
            border-radius: ${borderRadius};
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            border: 1px solid ${Color.borderGray()};
            @media (max-width: ${mobileMaxWidth}) {
              border-radius: 0;
              margin-top: 2rem;
              border-left: 0;
              border-right: 0;
            }
          `}
        >
          <Button
            onClick={handlePublish}
            color="darkBlue"
            skeuomorphic
            style={{ marginLeft: '1rem' }}
          >
            <Icon icon="upload" />
            <span style={{ marginLeft: '0.7rem' }}>Publish Content</span>
          </Button>
        </div>
      )}
    </div>
  );

  async function handlePublish() {
    const numUpdates = await publishInteractive(interactiveId);
    onPublishInteractive({ interactiveId, numUpdates });
  }
}
