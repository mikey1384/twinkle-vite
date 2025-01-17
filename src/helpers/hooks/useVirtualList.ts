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

  const recalcTimerRef = useRef<any>(null);
  const heightsMapRef = useRef<Map<string | number, number>>(new Map());

  const positionsRef = useRef<
    { start: number; end: number; key: string | number }[]
  >([]);

  const computeVisibleItems = useCallback(() => {
    if (!containerRef.current) {
      setVirtualItems([]);
      return;
    }
    if (items.length === 0) {
      setVirtualItems([]);
      return;
    }

    const scrollTop = containerRef.current.scrollTop;
    const viewHeight = containerRef.current.clientHeight;

    const buffer = overscan * estimateItemHeight;
    const minVisible = scrollTop - buffer;
    const maxVisible = scrollTop + viewHeight + buffer;

    // positionsRef.current is sorted by `start` because we build it that way in recalcPositions()
    const positions = positionsRef.current; // array of {start, end, key}

    // 1) Binary search for first visible index
    const firstIndex = findFirstVisibleIndex(positions, minVisible);

    // 2) Binary search for last visible index
    const lastIndex = findLastVisibleIndex(positions, maxVisible);

    if (
      firstIndex === positions.length ||
      lastIndex === -1 ||
      firstIndex > lastIndex
    ) {
      // No items in view
      setVirtualItems([]);
      return;
    }

    // Now build the VirtualItem[] from firstIndex to lastIndex
    const newVirtualItems: VirtualItem[] = [];
    for (let i = firstIndex; i <= lastIndex; i++) {
      const { start, end, key } = positions[i];
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

    // Because we just built them in ascending order (i from 0..n),
    // they should already be sorted by .start
    positionsRef.current = newPositions;
    totalHeightRef.current = startPos;

    computeVisibleItems();
  }, [computeVisibleItems, items, getItemKey, estimateItemHeight]);

  const measureItem = useCallback(
    (itemKey: string | number, newSize: number) => {
      // Round to nearest integer
      const roundedSize = Math.round(newSize);

      const currentSize =
        heightsMapRef.current.get(itemKey) ?? estimateItemHeight;

      // If difference is small, ignore it
      if (Math.abs(currentSize - roundedSize) < 5) {
        return;
      }

      heightsMapRef.current.set(itemKey, roundedSize);

      // Optionally, debounce recalcPositions
      if (recalcTimerRef.current) {
        clearTimeout(recalcTimerRef.current);
      }
      recalcTimerRef.current = setTimeout(() => {
        recalcPositions();
      }, 50);
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

/**
 * Finds the first item whose `end` is >= minVisible
 * (i.e., the first item that *might* be in view).
 *
 * @param positions - sorted array of {start, end, key}
 * @param minVisible
 * @returns index of the first visible item or positions.length if none
 */
function findFirstVisibleIndex(
  positions: { start: number; end: number; key: string | number }[],
  minVisible: number
): number {
  let left = 0;
  let right = positions.length;
  while (left < right) {
    const mid = (left + right) >>> 1; // integer division by 2
    if (positions[mid].end < minVisible) {
      // if item ends before minVisible, go right
      left = mid + 1;
    } else {
      // otherwise, this could be our first visible item, so go left
      right = mid;
    }
  }
  return left; // left is the first index with end >= minVisible
}

/**
 * Finds the last item whose `start` is <= maxVisible
 * (i.e., the last item that might be in view).
 *
 * @param positions - sorted array of {start, end, key}
 * @param maxVisible
 * @returns index of the last visible item or -1 if none
 */
function findLastVisibleIndex(
  positions: { start: number; end: number; key: string | number }[],
  maxVisible: number
): number {
  let left = 0;
  let right = positions.length - 1;
  let answer = -1;
  while (left <= right) {
    const mid = (left + right) >>> 1;
    if (positions[mid].start > maxVisible) {
      // item starts after maxVisible -> go left
      right = mid - 1;
    } else {
      // item starts on or before maxVisible, so record mid as answer, go right to find a bigger index
      answer = mid;
      left = mid + 1;
    }
  }
  return answer;
}
