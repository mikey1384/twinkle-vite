import { useState } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useInteractiveContext } from '~/contexts';
import Icon from '~/components/Icon';
import SelectArchivedSlideModal from '../SelectArchivedSlideModal';

InsertSlide.propTypes = {
  archivedSlides: PropTypes.array,
  forkedFrom: PropTypes.number,
  interactiveId: PropTypes.number,
  slideId: PropTypes.number,
  className: PropTypes.string,
  slideObj: PropTypes.object,
  style: PropTypes.object
};

export default function InsertSlide({
  archivedSlides,
  interactiveId,
  forkedFrom,
  slideId,
  slideObj,
  className,
  style
}) {
  const [insertingSlide, setInsertingSlide] = useState(false);
  const insertArchivedSlide = useAppContext(
    (v) => v.requestHelpers.insertArchivedSlide
  );
  const insertInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.insertInteractiveSlide
  );
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );
  const onInsertInteractiveSlide = useInteractiveContext(
    (v) => v.actions.onInsertInteractiveSlide
  );
  const onRecoverArchivedSlide = useInteractiveContext(
    (v) => v.actions.onRecoverArchivedSlide
  );
  const [selectArchivedSlideModalShown, setSelectArchivedSlideModalShown] =
    useState(false);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}
    >
      <button
        className={`unselectable ${css`
          ${insertingSlide
            ? ''
            : `&:hover {
            font-weight: bold;
          }`}
        `}`}
        style={{
          width: 'auto',
          padding: '0.5rem',
          background: '#fff',
          textAlign: 'center',
          border: `1px solid ${Color.borderGray()}`,
          cursor: insertingSlide ? 'default' : 'pointer',
          ...style
        }}
        disabled={insertingSlide}
        onClick={handleInsertSlide}
      >
        <Icon icon="plus" />
        <span style={{ marginLeft: '0.7rem', fontSize: '1.2rem' }}>
          insert{archivedSlides.length > 0 ? ' new' : ''}
        </span>
      </button>
      {archivedSlides.length > 0 && (
        <button
          className={`unselectable ${css`
            &:hover {
              font-weight: bold;
            }
          `}`}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem',
            background: '#fff',
            textAlign: 'center',
            border: `1px solid ${Color.borderGray()}`,
            cursor: 'pointer',
            ...style
          }}
          onClick={() => setSelectArchivedSlideModalShown(true)}
        >
          <Icon icon="archive" />
          <span style={{ marginLeft: '0.7rem', fontSize: '1.2rem' }}>
            archived
          </span>
        </button>
      )}
      {selectArchivedSlideModalShown && (
        <SelectArchivedSlideModal
          interactiveId={interactiveId}
          archivedSlides={archivedSlides}
          onDone={handleInsertArchivedSlide}
          onHide={() => setSelectArchivedSlideModalShown(false)}
        />
      )}
    </div>
  );

  async function handleInsertArchivedSlide(selectedSlideId) {
    const numUpdates = await insertArchivedSlide({
      interactiveId,
      slideId,
      selectedSlideId,
      forkedFrom
    });
    onChangeNumUpdates({ interactiveId, numUpdates });
    onInsertInteractiveSlide({
      interactiveId,
      forkedFrom,
      slideId,
      newSlide: slideObj[selectedSlideId]
    });
    onRecoverArchivedSlide({ interactiveId, slideId: selectedSlideId });
    setSelectArchivedSlideModalShown(false);
  }

  async function handleInsertSlide() {
    setInsertingSlide(true);
    const { slide, numUpdates } = await insertInteractiveSlide({
      interactiveId,
      forkedFrom,
      slideId
    });
    onChangeNumUpdates({ interactiveId, numUpdates });
    onInsertInteractiveSlide({
      interactiveId,
      forkedFrom,
      slideId,
      newSlide: slide
    });
    setInsertingSlide(false);
  }
}
