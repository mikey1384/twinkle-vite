export type ToolType = 'pencil' | 'eraser' | 'text' | 'colorPicker' | 'fill';

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}
