import React, { useEffect, useRef, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';

/**
 * Reusable share control for any embeddable Twinkle surface.
 *
 * Offers "Copy link" (plain canonical URL) and "Copy embed" (`![](url)` markdown
 * that renders as a rich embed card in any richtext input) so users don't have
 * to hand-type the embed syntax. Pass a relative `linkPath` (e.g.
 * `/achievements/teenager` or `subjects/123`); the current origin is prepended so
 * the link works in every environment (localhost in dev, the real domain in prod).
 */
export default function ShareButton({
  linkPath,
  variant = 'full',
  buttonVariant = 'soft',
  buttonTone,
  icon = 'share',
  color = 'darkerGray',
  iconSize,
  stretch,
  uppercase,
  style,
  buttonStyle,
  className
}: {
  linkPath: string;
  variant?: 'full' | 'compact';
  buttonVariant?: 'solid' | 'soft' | 'outline' | 'ghost';
  buttonTone?: 'flat' | 'raised';
  icon?: string;
  color?: string;
  iconSize?: string;
  stretch?: boolean;
  uppercase?: boolean;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const normalizedPath = linkPath.startsWith('/') ? linkPath : `/${linkPath}`;
  const shareUrl = `${window.location.origin}${normalizedPath}`;

  return (
    <DropdownButton
      className={className}
      style={style}
      buttonStyle={buttonStyle}
      icon={copied ? 'check' : icon}
      iconSize={iconSize}
      text={variant === 'compact' ? '' : copied ? 'Copied!' : 'Share'}
      variant={buttonVariant}
      tone={buttonTone}
      stretch={stretch}
      uppercase={uppercase}
      color={copied ? 'green' : color}
      menuProps={[
        {
          label: (
            <>
              <Icon icon="link" />
              <span style={{ marginLeft: '1rem' }}>Copy link</span>
            </>
          ),
          onClick: () => handleCopy(shareUrl)
        },
        {
          label: (
            <>
              <Icon icon="code" />
              <span style={{ marginLeft: '1rem' }}>Copy embed</span>
            </>
          ),
          onClick: () => handleCopy(`![](${shareUrl})`)
        }
      ]}
    />
  );

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }
}
