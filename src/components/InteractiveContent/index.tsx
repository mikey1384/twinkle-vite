import React, { useEffect, useMemo, useRef } from 'react';
import Slide from './Slide';
import Loading from '~/components/Loading';
import BottomInterface from './BottomInterface';
import {
  useAppContext,
  useInteractiveContext,
  useViewContext,
  useKeyContext
} from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function InteractiveContent({
  autoFocus,
  currentTutorialSlideId,
  interactiveId,
  onCurrentSlideIdChange,
  onGoBackToMission,
  onScrollElementTo,
  onScrollElementToCenter,
  isOnModal
}: {
  autoFocus?: boolean;
  currentTutorialSlideId?: number;
  interactiveId: number;
  onCurrentSlideIdChange?: (slideId: number) => void;
  onGoBackToMission: () => void;
  onScrollElementTo: (element: any) => void;
  onScrollElementToCenter: (element: any) => void;
  isOnModal?: boolean;
}) {
  const SlideRefs: any = useRef({});
  useEffect(() => {
    if (currentTutorialSlideId) {
      onScrollElementToCenter(SlideRefs.current[currentTutorialSlideId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const checkInteractiveNumUpdates = useAppContext(
    (v) => v.requestHelpers.checkInteractiveNumUpdates
  );
  const loadInteractive = useAppContext(
    (v) => v.requestHelpers.loadInteractive
  );
  const moveInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.moveInteractiveSlide
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const interactiveObj = useInteractiveContext((v) => v.state[interactiveId]);
  const onLoadInteractive = useInteractiveContext(
    (v) => v.actions.onLoadInteractive
  );
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );
  const onConcatDisplayedSlides = useInteractiveContext(
    (v) => v.actions.onConcatDisplayedSlides
  );
  const onMoveInteractiveSlide = useInteractiveContext(
    (v) => v.actions.onMoveInteractiveSlide
  );
  const onPublishInteractive = useInteractiveContext(
    (v) => v.actions.onPublishInteractive
  );
  const onSetDisplayedSlides = useInteractiveContext(
    (v) => v.actions.onSetDisplayedSlides
  );
  const onSetSlideState = useInteractiveContext(
    (v) => v.actions.onSetSlideState
  );
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const userId = useKeyContext((v) => v.myState.userId);
  const expanded = useRef(false);
  const prevDisplayedSlideIds = useRef([]);

  const canEdit = useMemo(() => managementLevel >= 2, [managementLevel]);
  const {
    numUpdates,
    prevUserId,
    loaded,
    slideObj = {},
    archivedSlideIds,
    displayedSlideIds = [],
    isPublished
  } = useMemo(() => interactiveObj || {}, [interactiveObj]);
  const displayedSlidesThatAreNotDeleted = useMemo(
    () =>
      displayedSlideIds?.filter(
        (slideId: number) => !slideObj[slideId].isDeleted
      ),
    [displayedSlideIds, slideObj]
  );

  const lastFork = useMemo(() => {
    const slides = displayedSlideIds?.map(
      (slideId: number) => slideObj[slideId]
    );
    const forks = slides?.filter(
      (slide: any) => slide.isFork && !slide.isDeleted
    );
    if (forks?.length > 0) {
      return forks[forks.length - 1];
    }
    return null;
  }, [displayedSlideIds, slideObj]);

  const archivedSlides = useMemo(() => {
    return archivedSlideIds
      ?.map((slideId: number) => slideObj[slideId])
      .filter((slide: any) => !slide.isFork);
  }, [archivedSlideIds, slideObj]);
  useEffect(() => {
    if (pageVisible) {
      handleCheckNumUpdates();
    }

    async function handleCheckNumUpdates() {
      if (loaded) {
        const newNumUpdates = await checkInteractiveNumUpdates(interactiveId);
        if (newNumUpdates > numUpdates) {
          const interactive = await loadInteractive(interactiveId);
          onLoadInteractive({
            ...interactive,
            loaded: true,
            prevUserId: userId
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible]);

  useEffect(() => {
    if (autoFocus && displayedSlideIds?.length === 1) {
      onScrollElementToCenter(
        SlideRefs.current[slideObj[displayedSlideIds[0]].id]
      );
    }
  }, [autoFocus, displayedSlideIds, slideObj, onScrollElementToCenter]);

  useEffect(() => {
    if (
      expanded.current &&
      slideObj[displayedSlideIds[displayedSlideIds.length - 1]]?.forkedFrom
    ) {
      setTimeout(() => {
        onScrollElementTo({
          element:
            SlideRefs.current[
              slideObj[
                displayedSlideIds[
                  displayedSlideIds.indexOf(
                    slideObj[displayedSlideIds[displayedSlideIds.length - 1]]
                      .forkedFrom
                  ) + 1
                ]
              ].id
            ],
          amount: 100
        });
      }, 10);
    }
    expanded.current = false;
  }, [displayedSlideIds, slideObj, onScrollElementTo]);

  useEffect(() => {
    if (displayedSlideIds?.length < prevDisplayedSlideIds?.current?.length) {
      if (
        displayedSlideIds[displayedSlideIds.length - 1] !==
        prevDisplayedSlideIds.current[prevDisplayedSlideIds.current.length - 1]
      ) {
        onScrollElementToCenter(
          SlideRefs.current[
            slideObj[displayedSlideIds[displayedSlideIds.length - 1]]?.id
          ]
        );
      }
    }
    prevDisplayedSlideIds.current = displayedSlideIds;
  }, [displayedSlideIds, slideObj, onScrollElementToCenter]);

  useEffect(() => {
    init();

    async function init() {
      if (interactiveId && userId && prevUserId !== userId) {
        const interactive = await loadInteractive(interactiveId);
        onLoadInteractive({
          ...interactive,
          loaded: true,
          prevUserId: userId
        });
      } else {
        onLoadInteractive({
          id: 0,
          loaded: true,
          numUpdates: 0,
          archivedSlideIds: [],
          displayedSlideIds: [],
          slideObj: {},
          isPublished: false,
          prevUserId: userId
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevUserId, interactiveId, loaded, userId]);

  return loaded ? (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {(isPublished || canEdit) && (
        <>
          {displayedSlideIds.map((slideId: number, index: number) => (
            <Slide
              {...slideObj[slideId]}
              key={slideId}
              archivedSlides={archivedSlides}
              displayedSlideIds={displayedSlideIds}
              index={index}
              innerRef={(ref: any) => (SlideRefs.current[slideId] = ref)}
              insertButtonShown={canEdit}
              cannotMoveUp={
                index === 0 || !!slideObj[displayedSlideIds[index - 1]]?.isFork
              }
              cannotMoveDown={
                index === displayedSlideIds.length - 1 ||
                !!slideObj[displayedSlideIds[index + 1]]?.isFork
              }
              isDeleted={!!slideObj[slideId].isDeleted}
              isPublished={!!slideObj[slideId].isPublished}
              isFork={!!slideObj[slideId].isFork}
              isPortal={!!slideObj[slideId].isPortal}
              forkedFrom={slideObj[slideId].forkedFrom}
              interactiveId={interactiveId}
              onExpandPath={slideObj[slideId].isFork ? handleExpandPath : null}
              onMoveSlide={handleMoveInteractiveSlide}
              onCurrentSlideIdChange={onCurrentSlideIdChange}
              portalButton={slideObj[slideId].portalButton}
              slideId={slideId}
              slideObj={slideObj}
              isLastSlide={
                index === displayedSlidesThatAreNotDeleted.length - 1
              }
              isOnModal={isOnModal}
              onGoBackToMission={onGoBackToMission}
            />
          ))}
        </>
      )}
      {loaded && canEdit && (
        <BottomInterface
          archivedSlides={archivedSlides}
          isPublished={!!isPublished}
          interactiveId={interactiveId}
          lastFork={lastFork}
          onPublishInteractive={onPublishInteractive}
          className={css`
            margin-top: ${displayedSlideIds.length === 0 ? 0 : '5rem'};
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: ${displayedSlideIds.length === 0 ? 0 : '2rem'};
            }
          `}
        />
      )}
    </div>
  ) : (
    <Loading />
  );

  function handleExpandPath({
    newSlides,
    slideId,
    buttonId
  }: {
    newSlides: number[];
    slideId: number;
    buttonId: number;
  }) {
    if (buttonId !== slideObj[slideId].selectedForkButtonId) {
      onSetSlideState({
        interactiveId,
        slideId,
        newState: { selectedForkButtonId: buttonId }
      });
      if (
        newSlides.filter((slideId) => !slideObj[slideId].isDeleted).length > 0
      ) {
        expanded.current = true;
      }
      if (slideObj[slideId].selectedForkButtonId) {
        const index = displayedSlideIds.indexOf(slideId);
        onSetDisplayedSlides({
          interactiveId,
          newSlides: displayedSlideIds.slice(0, index + 1)
        });
      }
      const validNewSlides = newSlides.filter(
        (slideId) => !!slideObj[slideId] && !slideObj[slideId]?.isDeleted
      );
      for (const slideId of validNewSlides) {
        onSetSlideState({
          interactiveId,
          slideId,
          newState: { selectedForkButtonId: null }
        });
      }
      onConcatDisplayedSlides({
        interactiveId,
        newSlides: validNewSlides
      });
    }
  }

  async function handleMoveInteractiveSlide({
    direction,
    interactiveId,
    slideId
  }: {
    direction: string;
    interactiveId: number;
    slideId: number;
  }) {
    const numUpdates = await moveInteractiveSlide({
      direction,
      forkedFrom: slideObj[slideId].forkedFrom,
      interactiveId,
      slideId
    });
    onChangeNumUpdates({ interactiveId, numUpdates });
    onMoveInteractiveSlide({ direction, interactiveId, slideId });
  }
}
