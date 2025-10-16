import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function NewTopButton({
  onClick,
  loading,
  children,
  variant = 'slate',
  style,
  isChecked
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'slate' | 'magenta' | 'purple' | 'orange' | 'green' | 'gold' | 'logoBlue';
  style?: React.CSSProperties;
  isChecked?: boolean;
}) {
  useKeyContext(() => null); // keep hook consistency if needed later

  const color =
    variant === 'magenta'
      ? 'magenta'
      : variant === 'purple'
      ? 'purple'
      : variant === 'orange'
      ? 'orange'
      : variant === 'green'
      ? 'green'
      : variant === 'gold'
      ? 'gold'
      : variant === 'logoBlue'
      ? 'logoBlue'
      : 'logoBlue';

  return (
    <Button
      onClick={onClick}
      style={style}
      color={color}
      variant="soft"
      tone="raised"
      shape="pill"
      size="md"
      uppercase={false}
      disabled={!!loading}
    >
      {children}
      {isChecked ? <span style={{ marginLeft: '0.5rem' }}>✓</span> : null}
    </Button>
  );
}
