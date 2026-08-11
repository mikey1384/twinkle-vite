import React, { useEffect, useMemo } from 'react';
import DropdownButton from './DropdownButton';
import DropdownMenu from './DropdownMenu';
import { useOutsideClick } from '~/helpers/hooks';

export interface Item {
  label: string;
  value: number;
  disabled?: boolean;
}

export default function LevelDropdown({
  items,
  selectedLabel,
  onSelect,
  disabled
}: {
  items: Item[];
  selectedLabel: string;
  onSelect: (value: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLUListElement | null>(null);
  const didInitialScrollRef = React.useRef<boolean>(false);

  // Capture-phase outside detection (same as the shared DropdownList): the
  // Modal backdrop stops bubble-phase mousedown/touchstart propagation, so
  // plain document listeners never fire for taps inside a modal.
  const outsideClickRefs = useMemo(() => [btnRef, menuRef], []);
  useOutsideClick(outsideClickRefs, () => setOpen(false), {
    capture: true,
    enabled: open
  });

  // Anchor positioning and viewport updates
  useEffect(() => {
    if (!open) return;
    function handleResize() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setAnchorRect({ x: r.x, y: r.y, width: r.width, height: r.height });
    }
    handleResize();
    function handleScroll(e: Event) {
      const target = e.target as Node | null;
      if (target && menuRef.current && menuRef.current.contains(target)) return;
      handleResize();
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <DropdownButton
        ref={btnRef}
        disabled={!!disabled}
        label={selectedLabel}
        onToggle={handleToggle}
      />
      <DropdownMenu
        open={open}
        anchorRect={anchorRect}
        items={items}
        selectedLabel={selectedLabel}
        menuRef={menuRef}
        didInitialScrollRef={didInitialScrollRef}
        onSelect={handleSelect}
      />
    </>
  );

  function handleToggle() {
    if (disabled) return;
    if (!open) {
      didInitialScrollRef.current = false;
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect();
        setAnchorRect({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height
        });
      }
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  function handleSelect(v: number) {
    onSelect(v);
    setOpen(false);
  }
}
