import React, {
  type ReactNode,
  useEffect,
  useRef,
  useState
} from 'react';
import ConfirmModal from '../ConfirmModal';

export interface ConfirmModalOptions {
  title: ReactNode;
  description?: ReactNode;
  descriptionFontSize?: string;
  confirmButtonColor?: string;
  confirmButtonLabel?: string;
  isReverseButtonOrder?: boolean;
  modalOverModal?: boolean;
  modalLevel?: number;
}

export default function useConfirmModal() {
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmModalOptions | null>(null);

  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  function requestConfirm(nextOptions: ConfirmModalOptions) {
    resolverRef.current?.(false);
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }

  function resolveConfirm(confirmed: boolean) {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    resolve?.(confirmed);
  }

  const confirmModal = options ? (
    <ConfirmModal
      title={options.title}
      description={options.description}
      descriptionFontSize={options.descriptionFontSize}
      confirmButtonColor={options.confirmButtonColor}
      confirmButtonLabel={options.confirmButtonLabel}
      isReverseButtonOrder={options.isReverseButtonOrder}
      modalOverModal={options.modalOverModal}
      modalLevel={options.modalLevel}
      onHide={() => resolveConfirm(false)}
      onConfirm={() => resolveConfirm(true)}
    />
  ) : null;

  return {
    confirmModal,
    requestConfirm
  };
}
