import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ItemWithId {
  id: string | number;
}

interface UseVirtualListProps<T extends ItemWithId> {
  items: T[];
  estimateItemHeight?: number;
  overscan?: number;
  containerRef: React.RefObject<HTMLElement>;
  getItemKey?: (item: T) => string | number;
}

export interface VirtualItem {
  key: string | number;
  index: number;
  start: number;
  size: number;
  end: number;
}

export function useVirtualListWithKeys<T extends ItemWithId>({
  items,
  estimateItemHeight = 100,
  overscan = 3,
  containerRef,
  getItemKey = (item) => item.id
}: UseVirtualListProps<T>) {
  const [virtualItems, setVirtualItems] = useState<VirtualItem[]>([]);
  const totalHeightRef = useRef<number>(0);

  const heightsMapRef = useRef<Map<string | number, number>>(new Map());

  const positionsRef = useRef<
    { start: number; end: number; key: string | number }[]
  >([]);

  const computeVisibleItems = useCallback(() => {
    if (!containerRef.current) {
      setVirtualItems([]);
      return;
    }
    // Edge case: empty list
    if (items.length === 0) {
      setVirtualItems([]);
      return;
    }

    const scrollTop = containerRef.current.scrollTop;
    const viewHeight = containerRef.current.clientHeight;

    const buffer = overscan * estimateItemHeight;
    const minVisible = scrollTop - buffer;
    const maxVisible = scrollTop + viewHeight + buffer;

    const newVirtualItems: VirtualItem[] = [];

    for (let i = 0; i < positionsRef.current.length; i++) {
      const { start, end, key } = positionsRef.current[i];
      if (end < minVisible) {
        continue;
      }
      if (start > maxVisible) {
        break;
      }
      newVirtualItems.push({
        key,
        index: i,
        start,
        size: end - start,
        end
      });
    }

    setVirtualItems(newVirtualItems);
  }, [containerRef, items.length, overscan, estimateItemHeight]);

  const recalcPositions = useCallback(() => {
    let startPos = 0;
    const newPositions: { start: number; end: number; key: string | number }[] =
      [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemKey = getItemKey(item);
      const size = heightsMapRef.current.get(itemKey) ?? estimateItemHeight;
      const endPos = startPos + size;

      newPositions.push({
        start: startPos,
        end: endPos,
        key: itemKey
      });

      startPos = endPos;
    }

    positionsRef.current = newPositions;
    totalHeightRef.current = startPos;
    computeVisibleItems();
  }, [items, estimateItemHeight, getItemKey, computeVisibleItems]);

  const measureItem = useCallback(
    (itemKey: string | number, newSize: number) => {
      const currentSize =
        heightsMapRef.current.get(itemKey) ?? estimateItemHeight;
      if (Math.abs(currentSize - newSize) > 1) {
        heightsMapRef.current.set(itemKey, newSize);
        recalcPositions();
      }
    },
    [estimateItemHeight, recalcPositions]
  );

  const pruneRemovedKeys = useCallback(() => {
    const currentKeys = new Set(items.map(getItemKey));
    for (const key of heightsMapRef.current.keys()) {
      if (!currentKeys.has(key)) {
        heightsMapRef.current.delete(key);
      }
    }
  }, [items, getItemKey]);

  useEffect(() => {
    pruneRemovedKeys();
    recalcPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      computeVisibleItems();
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, computeVisibleItems]);

  return {
    virtualItems,
    totalHeight: totalHeightRef.current,
    measureItem
  };
}
