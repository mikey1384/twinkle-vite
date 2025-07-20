import { useState, useCallback } from 'react';

export interface UseModalReturn {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Function to open the modal */
  open: () => void;
  /** Function to close the modal */
  close: () => void;
  /** Function to toggle the modal state */
  toggle: () => void;
  /** Suggested modal level for stacking */
  modalLevel: number;
}

export interface UseNestedModalReturn extends UseModalReturn {
  /** Modal level specifically calculated for nested modal */
  modalLevel: number;
}

/**
 * Custom hook for managing modal state
 * 
 * @param initialOpen - Initial open state (default: false)
 * @returns Object with modal state and control functions
 * 
 * @example
 * ```tsx
 * const modal = useModal();
 * 
 * return (
 *   <>
 *     <Button onClick={modal.open}>Open Modal</Button>
 *     <NewModal 
 *       isOpen={modal.isOpen} 
 *       onClose={modal.close}
 *       modalLevel={modal.modalLevel}
 *     >
 *       Modal content
 *     </NewModal>
 *   </>
 * );
 * ```
 */
export function useModal(initialOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    modalLevel: 0 // Base level modal
  };
}

/**
 * Custom hook for managing nested modal state (modal-over-modal)
 * 
 * @param parentModalLevel - The modal level of the parent modal
 * @param initialOpen - Initial open state (default: false)
 * @returns Object with modal state and control functions for nested modal
 * 
 * @example
 * ```tsx
 * const parentModal = useModal();
 * const childModal = useNestedModal(parentModal.modalLevel);
 * 
 * return (
 *   <>
 *     <NewModal 
 *       isOpen={parentModal.isOpen} 
 *       onClose={parentModal.close}
 *       modalLevel={parentModal.modalLevel}
 *     >
 *       <Button onClick={childModal.open}>Open Nested Modal</Button>
 *       
 *       <NewModal 
 *         isOpen={childModal.isOpen} 
 *         onClose={childModal.close}
 *         modalLevel={childModal.modalLevel}
 *       >
 *         Nested modal content
 *       </NewModal>
 *     </NewModal>
 *   </>
 * );
 * ```
 */
export function useNestedModal(parentModalLevel: number, initialOpen = false): UseNestedModalReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    modalLevel: parentModalLevel + 1
  };
}

export default useModal;