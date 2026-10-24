import React from 'react';
import PaperDiagram, {
  type DiagramElement,
  type DiagramVisual
} from './PaperDiagram';
import { MAP_BASES, type LonLat } from './mapOutlines';

// A locator map drawn by our own code (Arena 10-25), the way 통합사회 and
// 한국사 papers print them: white land with a black coast, thin dashed
// borders, shaded countries, rivers, and places marked A, B, (가) by
// latitude and longitude. The outlines are bundled and simplified
// (mapOutlines.ts); twinkle-api helpers/arena/diagram.ts checks the item.

type Fill = 'none' | 'hatch' | 'light' | 'white';
type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'c';
interface LatLon {
  lat: number;
  lon: number;
}

export interface MapVisual {
  kind: 'map';
  base: string;
  width: number;
  bounds?: { west: number; east: number; south: number; north: number };
  shade?: { area: string; fill?: Fill }[];
  rivers?: string[];
  markers?: (LatLon & {
    label?: string;
    labelPos?: Compass;
    mark?: 'dot' | 'hollow' | 'none';
  })[];
  arrows?: { from: LatLon; to: LatLon; dashed?: boolean }[];
  regions?: { coords: LatLon[]; fill?: Fill }[];
  lines?: { coords: LatLon[]; dashed?: boolean }[];
  title?: string;
  note?: string;
  alt?: string;
}

export default function PaperMap({ visual }: { visual: MapVisual }) {
  const diagram = mapToDiagram(visual);
  if (!diagram) return null;
  return <PaperDiagram visual={diagram} />;
}

// An equirectangular projection scaled by the cosine of the middle
// latitude, so shapes keep their proportions at the map's latitude.
export function mapToDiagram(visual: MapVisual): DiagramVisual | null {
  const base = MAP_BASES[visual.base];
  if (!base) return null;
  const bounds = visual.bounds || base.bounds;
  const k = Math.cos(((bounds.south + bounds.north) / 2) * (Math.PI / 180));
  const x = (lon: number) => (lon - bounds.west) * k;
  const xy = ([lon, lat]: LonLat): [number, number] => [x(lon), lat];
  const ll = (p: LatLon): [number, number] => [x(p.lon), p.lat];
  const spanX = (bounds.east - bounds.west) * k;
  const spanY = bounds.north - bounds.south;
  const width = visual.width;
  const height = Math.round((width * spanY) / spanX);
  const elements: DiagramElement[] = [];
  // land: white fill first; the coast is stroked again at the end so shading
  // never thins it
  for (const land of base.land) {
    elements.push({
      type: 'outline',
      coords: land.map(xy),
      closed: true,
      fill: 'white',
      stroke: false
    });
  }
  for (const lake of base.lakes) {
    elements.push({
      type: 'outline',
      coords: lake.map(xy),
      closed: true,
      fill: 'none',
      thin: true
    });
  }
  for (const region of visual.regions || []) {
    elements.push({
      type: 'outline',
      coords: region.coords.map(ll),
      closed: true,
      fill: region.fill || 'light',
      stroke: false
    });
  }
  for (const shade of visual.shade || []) {
    const area = base.areas[shade.area];
    if (area) {
      elements.push({
        type: 'outline',
        coords: area.map(xy),
        closed: true,
        fill: shade.fill || 'light',
        stroke: false
      });
    }
  }
  for (const area of Object.values(base.areas)) {
    elements.push({
      type: 'outline',
      coords: area.map(xy),
      closed: true,
      fill: 'none',
      thin: true,
      dashed: true
    });
  }
  for (const border of base.borders) {
    elements.push({
      type: 'outline',
      coords: border.map(xy),
      thin: true,
      dashed: true
    });
  }
  for (const name of visual.rivers || []) {
    const river = base.rivers[name];
    if (river) elements.push({ type: 'outline', coords: river.map(xy) });
  }
  for (const line of visual.lines || []) {
    elements.push({
      type: 'outline',
      coords: line.coords.map(ll),
      dashed: line.dashed
    });
  }
  for (const land of base.land) {
    elements.push({
      type: 'outline',
      coords: land.map(xy),
      closed: true,
      fill: 'none'
    });
  }
  // the frame
  elements.push({
    type: 'outline',
    coords: [
      [0, bounds.south],
      [spanX, bounds.south],
      [spanX, bounds.north],
      [0, bounds.north]
    ],
    closed: true,
    fill: 'none'
  });
  (visual.arrows || []).forEach((arrow, i) => {
    const [x1, y1] = ll(arrow.from);
    const [x2, y2] = ll(arrow.to);
    elements.push({ type: 'point', id: `af${i}`, x: x1, y: y1, dot: false });
    elements.push({ type: 'point', id: `at${i}`, x: x2, y: y2, dot: false });
    elements.push({
      type: 'segment',
      from: `af${i}`,
      to: `at${i}`,
      arrow: 'end',
      dashed: arrow.dashed
    });
  });
  (visual.markers || []).forEach((marker, i) => {
    const [mx, my] = ll(marker);
    elements.push({
      type: 'point',
      id: `m${i}`,
      x: mx,
      y: my,
      label: marker.label,
      labelPos: marker.labelPos || (marker.mark === 'none' ? 'c' : 'ne'),
      dot: marker.mark !== 'none',
      hollow: marker.mark === 'hollow'
    });
  });
  return {
    kind: 'diagram',
    width,
    height,
    view: { xMin: 0, xMax: spanX, yMin: bounds.south, yMax: bounds.north },
    elements,
    title: visual.title,
    note: visual.note,
    alt: visual.alt
  };
}
