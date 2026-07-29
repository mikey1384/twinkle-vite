import React, { useEffect, useMemo, useRef, useState } from 'react';
import Textarea from '~/components/Texts/Textarea';
import SelectRewardAmount from './SelectRewardAmount';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  addCommasToNumber,
  addEmoji,
  exceedsCharLimit,
  finalizeEmoji,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import Button from '~/components/Button';
import { priceTable } from '~/constants/defaultValues';
import { isSupermod } from '~/helpers';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { getRewardCapacity } from './rewardCapacity';

const clearLabel = 'Clear';
const rewardLabel = 'Reward';

export default function XPRewardInterface({
  contentId,
  contentType,
  innerRef,
  rewardLevel,
  rewardContextId,
  rewardContextType,
  noPadding,
  onReward,
  rewards,
  uploaderId,
  uploaderLevel
}: {
  contentId: number;
  contentType: string;
  innerRef: any;
  rewardLevel: number;
  rewardContextId?: number;
  rewardContextType?: string;
  noPadding?: boolean;
  onReward: () => void;
  rewards: any[];
  uploaderId: number;
  uploaderLevel: number;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const rewardUser = useAppContext((v) => v.requestHelpers.rewardUser);
  const level = useKeyContext((v) => v.myState.level);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const banned = useKeyContext((v) => v.myState.banned);
  const { colorKey: rewardColor } = useRoleColor('reward', {
    fallback: 'pink'
  });
  const rewardFormState =
    useInputContext((v) => v.state['reward' + contentType + contentId]) || {};
  const onSetRewardForm = useInputContext((v) => v.actions.onSetRewardForm);
  const onAttachReward = useContentContext((v) => v.actions.onAttachReward);
  const onSyncContentRewards = useContentContext(
    (v) => v.actions.onSyncContentRewards
  );
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );

  const { comment: prevComment = '', selectedAmount: prevSelectedAmount = 0 } =
    rewardFormState;

  const { maxRewardAmountForOnePerson, myRewardables, rewardables } =
    useMemo(() => {
      return getRewardCapacity({ rewards, rewardLevel, userId });
    }, [rewardLevel, rewards, userId]);

  const commentRef = useRef(prevComment);
  const rewardingRef = useRef(false);
  const [rewarding, setRewarding] = useState(false);
  const [comment, setComment] = useState(prevComment);
  const selectedAmountRef = useRef(prevSelectedAmount);
  useEffect(() => {
    setSelectedAmount(prevSelectedAmount);
    selectedAmountRef.current = prevSelectedAmount;
  }, [prevSelectedAmount]);
  const [selectedAmount, setSelectedAmount] = useState(prevSelectedAmount);
  const [capReached, setCapReached] = useState(false);
  // Read by the auto-hide effect, which must not close the panel out from under
  // the "reward limit reached" notice.
  const capReachedRef = useRef(false);
  const requiresPayment = useMemo(() => {
    return !level || !isSupermod(level) || uploaderLevel >= level;
  }, [level, uploaderLevel]);

  useEffect(() => {
    setSelectedAmount((selectedAmount: number) =>
      Math.min(selectedAmount, rewardables)
    );
    if (rewardables > 0 && capReachedRef.current) {
      handleSetCapReached(false);
    }
    if (rewardables === 0 && !rewardingRef.current && !capReachedRef.current) {
      onSetXpRewardInterfaceShown({
        contentId,
        contentType,
        shown: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewardables]);

  useEffect(() => {
    handleSetComment(prevComment);
  }, [prevComment]);

  const rewardCommentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'rewardComment',
        text: comment
      }),
    [comment]
  );

  const rewardStatusText = useMemo(() => {
    if (selectedAmount > 0) {
      return `Reward ${selectedAmount} Twinkle${
        selectedAmount > 1 ? 's' : ''
      } (${addCommasToNumber(selectedAmount * 200)} XP)`;
    }
    return 'Select reward amount';
  }, [selectedAmount]);

  const rewardReasonLabel = useMemo(() => {
    return `Let the recipient know why you are rewarding XP for this ${
      contentType === 'url' ? 'link' : contentType
    } (optional)`;
  }, [contentType]);

  const confirmText = useMemo(() => {
    return (
      <div style={{ display: 'inline' }}>
        {rewardLabel}
        {requiresPayment ? (
          <div style={{ display: 'inline' }}>
            &nbsp;(
            <Icon icon="coins" />
            <span style={{ marginLeft: '0.5rem' }}>
              {selectedAmount * priceTable.reward}
            </span>
            )
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }, [requiresPayment, selectedAmount]);

  useEffect(() => {
    return function cleanUp() {
      onSetRewardForm({
        contentType,
        contentId,
        form: {
          comment: commentRef.current,
          selectedAmount: selectedAmountRef.current,
          rewardLevel
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return userId && uploaderId !== userId ? (
    <div
      ref={innerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: noPadding ? '1rem 0 0 0' : '1rem',
        fontSize: '1.6rem',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <Icon
        style={{ position: 'absolute', right: '1rem', cursor: 'pointer' }}
        className={css`
          color: ${Color.darkGray()};
          font-size: 2rem;
          &:hover {
            color: ${Color.black()};
          }
        `}
        onClick={() => {
          onSetXpRewardInterfaceShown({
            contentId,
            contentType,
            shown: false
          });
        }}
        icon="times"
      />
      <section style={{ fontWeight: 'bold' }}>{rewardStatusText}</section>
      {capReached ? (
        <section
          style={{
            marginTop: '0.5rem',
            color: Color.darkGray(),
            fontSize: '1.3rem',
            textAlign: 'center'
          }}
        >
          {`This ${
            contentType === 'url' ? 'link' : contentType
          } has reached its reward limit`}
        </section>
      ) : null}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'center'
        }}
      >
        <SelectRewardAmount
          onSetSelectedAmount={handleSetSelectedAmount}
          rewardables={rewardables}
          selectedAmount={selectedAmount}
        />
        {selectedAmount > 0 && (
          <a
            style={{
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '-0.5rem'
            }}
            onClick={() => handleSetSelectedAmount(0)}
          >
            {clearLabel}
          </a>
        )}
      </section>
      {selectedAmount > 0 && (
        <Textarea
          className={css`
            margin-top: 1rem;
          `}
          minRows={3}
          value={comment}
          onChange={(event: any) => {
            handleSetComment(addEmoji(event.target.value));
          }}
          placeholder={rewardReasonLabel}
          hasError={!!rewardCommentExceedsCharLimit}
        />
      )}
      {selectedAmount > 0 && (
        <section
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            width: '100%',
            marginTop: '1rem'
          }}
        >
          <Button
            color={selectedAmount > 4 ? rewardColor : 'logoBlue'}
            variant="solid"
            loading={rewarding}
            disabled={
              !!rewardCommentExceedsCharLimit ||
              selectedAmount === 0 ||
              (requiresPayment &&
                twinkleCoins < selectedAmount * priceTable.reward)
            }
            onClick={handleRewardSubmit}
          >
            {confirmText}
          </Button>
        </section>
      )}
    </div>
  ) : null;

  async function handleRewardSubmit() {
    if (rewardingRef.current) return;
    rewardingRef.current = true;
    setRewarding(true);
    try {
      const {
        alreadyRewarded,
        reward,
        netCoins,
        rewards: canonicalRewards
      } = await rewardUser({
        maxRewardAmountForOnePerson,
        explanation: banned?.posting
          ? ''
          : finalizeEmoji(stringIsEmpty(comment) ? '' : comment),
        amount: selectedAmount,
        contentType,
        contentId,
        rewardContextType,
        rewardContextId,
        uploaderId
      });
      if (alreadyRewarded) {
        if (!Array.isArray(canonicalRewards)) {
          throw new Error(
            'Reward cap rejection did not include canonical rewards'
          );
        }
        // The rejection response carries the writer-confirmed ledger snapshot.
        // Replace every rendered copy before allowing another selection.
        const { rewardables: canonicalRewardables } = getRewardCapacity({
          rewards: canonicalRewards,
          rewardLevel,
          userId
        });
        handleSetCapReached(canonicalRewardables === 0);
        handleSetSelectedAmount(0);
        onSyncContentRewards({
          contentId,
          contentType,
          rewards: canonicalRewards
        });
        return;
      }
      onSetRewardForm({
        contentType,
        contentId,
        form: null
      });
      if (reward) {
        onAttachReward({
          reward,
          contentId,
          contentType
        });
      }
      if (typeof netCoins === 'number') {
        onSetUserState({ userId, newState: { twinkleCoins: netCoins } });
      }
      if (selectedAmount === myRewardables) {
        onReward?.();
      }
      handleSetComment('');
      handleSetSelectedAmount(0);
      onSetXpRewardInterfaceShown({
        contentId,
        contentType,
        shown: false
      });
    } catch (error) {
      console.error(error);
    } finally {
      rewardingRef.current = false;
      setRewarding(false);
    }
  }

  function handleSetComment(text: string) {
    setComment(text);
    commentRef.current = text;
  }

  function handleSetSelectedAmount(amount: number) {
    setSelectedAmount(amount);
    selectedAmountRef.current = amount;
  }

  function handleSetCapReached(reached: boolean) {
    setCapReached(reached);
    capReachedRef.current = reached;
  }
}
