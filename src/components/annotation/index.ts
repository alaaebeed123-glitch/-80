export {
  AnnotationProvider,
  useAnnotation,
  useAnnotationActions,
  useAnnotationToolState,
  useAnnotationDockState,
} from './AnnotationContext';
export { AnnotationSurface } from './AnnotationSurface';
export { AnnotationToolCursor } from './AnnotationToolCursor';
export { FloatingAnnotationPalette } from './FloatingAnnotationPalette';
export { GlobalAnnotationLayer, OpticalLaserLayer } from './GlobalAnnotationLayer';
export type {
  AnnotationPoint,
  AnnotationShape,
  AnnotationStroke,
  AnnotationTool,
  EraserMode,
  EraserSettings,
  HighlighterSettings,
  LaserSettings,
  PenLineStyle,
  PenSettings,
  SelectedStrokeAnchor,
} from './types';
