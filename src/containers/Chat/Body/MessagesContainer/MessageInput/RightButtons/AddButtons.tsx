import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UploadButton from '~/components/Buttons/UploadButton';
import { useAppContext, useChatContext } from '~/contexts';
import SponsoredHelpModal from '~/containers/Chat/Modals/SponsoredHelpModal';

// Whether "Have Zero/Ciel do this" is on (the server's sponsored_help switch),
// read once per page load.
let sponsoredHelpConfigPromise: Promise<any> | null = null;
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';

export default function AddButtons({
  channelId,
  currentTransactionId,
  disabled,
  isTradeButtonShown,
  isTwoPeopleChannel,
  isAIChannel,
  myId,
  onFileSelect,
  onFilesSelect,
  onSelectVideoButtonClick,
  onSetTransactionModalShown
}: {
  channelId: number;
  currentTransactionId: number;
  disabled: boolean;
  isTradeButtonShown: boolean;
  isTwoPeopleChannel: boolean;
  isAIChannel?: boolean;
  myId: number;
  onFileSelect: (file: File) => void;
  onFilesSelect: (files: File[]) => void;
  onSelectVideoButtonClick: () => any;
  onSetTransactionModalShown: (v: boolean) => any;
}) {
  const [transactionButtonIsGlowing, setTransactionButtonIsGlowing] =
    useState(false);
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const isGoldTheme = alertRole.themeName === 'gold';
  const isOrangeTheme = alertRole.themeName === 'orange';
  const buttonRole = useRoleColor('button', { fallback: 'logoBlue' });
  const buttonColorKey = buttonRole.colorKey;
  const buttonHoverRole = useRoleColor('buttonHovered', {
    fallback: buttonColorKey
  });
  const buttonHoverColorKey = buttonHoverRole.colorKey || buttonColorKey;

  // Override base colors for gold and orange theme buttons to keep contrast high
  const baseButtonColorKey = isGoldTheme
    ? 'bluerGray'
    : isOrangeTheme
    ? 'darkGray'
    : buttonColorKey;
  const baseHoverColorKey = isGoldTheme
    ? 'darkBluerGray'
    : isOrangeTheme
    ? 'darkerGray'
    : buttonHoverColorKey;

  const getTint = (key: string, alpha: number, fallbackKey = 'gold') => {
    const fn = (Color as any)[key];
    if (typeof fn === 'function') return fn(alpha);
    const fallbackFn = (Color as any)[fallbackKey];
    return typeof fallbackFn === 'function' ? fallbackFn(alpha) : fallbackKey;
  };

  const glowHoverKey = 'gold';
  const hoveredSoftBg = getTint(glowHoverKey, 0.18);
  const hoveredSoftBorder = getTint(glowHoverKey, 0.32);
  const hoveredText = getTint(glowHoverKey, 1);

  const loadPendingTransaction = useAppContext(
    (v) => v.requestHelpers.loadPendingTransaction
  );
  const loadSponsoredHelpConfig = useAppContext(
    (v) => v.requestHelpers.loadSponsoredHelpConfig
  );
  const channelMembers = useChatContext(
    (v) => v.state.channelsObj?.[channelId]?.members
  );
  const [sponsoredHelpConfig, setSponsoredHelpConfig] = useState<any>(null);
  const [sponsoredHelpShown, setSponsoredHelpShown] = useState(false);
  const partner = Array.isArray(channelMembers)
    ? channelMembers.find((member: any) => Number(member?.id) !== Number(myId))
    : null;
  const sponsoredHelpAvailable =
    isTwoPeopleChannel &&
    !isAIChannel &&
    !!partner?.username &&
    sponsoredHelpConfig?.enabled === true;

  useEffect(() => {
    if (!isTwoPeopleChannel || isAIChannel) return;
    let cancelled = false;
    const configPromise = (sponsoredHelpConfigPromise ||=
      loadSponsoredHelpConfig().catch(() => {
        sponsoredHelpConfigPromise = null;
        return null;
      }));
    void configPromise.then((config: any) => {
      if (!cancelled) setSponsoredHelpConfig(config);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTwoPeopleChannel, isAIChannel]);

  useEffect(() => {
    if (isTwoPeopleChannel) {
      init();
    }
    if (!currentTransactionId) {
      setTransactionButtonIsGlowing(false);
    }
    async function init() {
      const { transaction } = await loadPendingTransaction(channelId);
      setTransactionButtonIsGlowing(transaction && transaction.from !== myId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, currentTransactionId]);

  return (
    <div
      style={{
        display: 'flex',
        margin: '0.2rem 0 0.2rem 0',
        alignItems: 'center'
      }}
    >
      {isTwoPeopleChannel && isTradeButtonShown && !isAIChannel && (
        <Button
          aria-label="Open trade"
          variant="soft"
          tone="raised"
          disabled={disabled}
          onClick={onSetTransactionModalShown}
          color={baseButtonColorKey}
          mobilePadding="0.5rem"
          hoverColor={baseHoverColorKey}
          style={
            transactionButtonIsGlowing
              ? {
                  background: hoveredSoftBg,
                  borderColor: hoveredSoftBorder,
                  color: hoveredText
                }
              : undefined
          }
        >
          <Icon size="lg" icon="coins" />
        </Button>
      )}
      {sponsoredHelpAvailable && (
        <Button
          aria-label="Have Zero or Ciel do something for them"
          variant="soft"
          tone="raised"
          disabled={disabled}
          onClick={() => setSponsoredHelpShown(true)}
          color={baseButtonColorKey}
          mobilePadding="0.5rem"
          hoverColor={baseHoverColorKey}
          style={{ marginLeft: isTradeButtonShown ? '0.5rem' : 0 }}
        >
          <Icon size="lg" icon="wand-magic-sparkles" />
        </Button>
      )}
      {sponsoredHelpShown && partner?.username && (
        <SponsoredHelpModal
          channelId={channelId}
          partnerUsername={partner.username}
          percents={sponsoredHelpConfig?.percents}
          taskMaxLength={sponsoredHelpConfig?.taskMaxLength}
          onHide={() => setSponsoredHelpShown(false)}
        />
      )}
      <UploadButton
        icon="upload"
        disabled={disabled}
        onFileSelect={onFileSelect}
        onFilesSelect={onFilesSelect}
        multiple
        color={baseButtonColorKey}
        hoverColor={baseHoverColorKey}
        mobilePadding={isTwoPeopleChannel ? '0.5rem' : undefined}
        style={{
          marginLeft: isTwoPeopleChannel && !isAIChannel ? '0.5rem' : 0
        }}
      />
      {!isAIChannel && (
        <Button
          aria-label="Attach a video"
          variant="soft"
          tone="raised"
          disabled={disabled}
          color={baseButtonColorKey}
          hoverColor={baseHoverColorKey}
          onClick={onSelectVideoButtonClick}
          mobilePadding={isTwoPeopleChannel ? '0.5rem' : undefined}
          style={{ marginLeft: '0.5rem' }}
        >
          <Icon size="lg" icon="film" />
        </Button>
      )}
    </div>
  );
}
