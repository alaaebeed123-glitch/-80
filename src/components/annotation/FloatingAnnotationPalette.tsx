import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  Copy,
  GripVertical,
  MousePointer2,
  PenTool,
  Redo2,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  useAnnotationActions,
  useAnnotationDockState,
  useAnnotationToolState,
} from './AnnotationContext';
import {
  APPLE_HIGHLIGHTER_COLORS,
  APPLE_LASER_COLORS,
  APPLE_PEN_COLORS,
  SIZE_DIAL_MAX,
  SIZE_DIAL_MIN,
  SIZE_DIAL_STEP,
  applyMagneticSnap,
  clampSizeLevel,
  pxToSizeLevel,
  sizeLevelToPx,
  snapSizeLevel,
  type AnnotationTool,
  type ColorSlotIndex,
  type ColorSwatch,
  type ColorableAnnotationTool,
  type SizableAnnotationTool,
  type SizeSlotIndex,
} from './types';
import { toArabicDigits } from '../../utils/mushafData';

/**
 * Realistic Apple PencilKit-grade static studio illustrations (viewBox 46x54).
 * Uses pure multi-stop cylindrical gradients and crisp specular highlights —
 * wrapped in React.memo with zero SVG filters or motion transitions for zero lag.
 */
const ApplePenNibSvg = React.memo<{ color: string; sizeLevel: number }>(({ color, sizeLevel }) => {
  const gaugeRadius = Math.max(1.7, Math.min(3.6, 1.7 + ((sizeLevel - 5) / 95) * 1.9));

  return (
    <svg className="apple-nib-svg" viewBox="0 0 46 80" fill="none" aria-hidden="true">
      {/* Precision color-matched ink nib with fine edge sheen */}
      <path
        d="M23 3.2C23.52 3.2 24.02 3.6 24.28 4.26L26.55 10.6C24.3 11.24 21.7 11.24 19.45 10.6L21.72 4.26C21.98 3.6 22.48 3.2 23 3.2Z"
        fill={color}
      />
      <path
        d="M22.35 4.75L20.95 9.85C21.45 10.0 21.9 10.05 22.3 10.05L22.9 4.8Z"
        fill="rgba(255, 255, 255, 0.42)"
      />
      {/* Sculpted matte-porcelain conical nose */}
      <path
        d="M19.45 10.6C21.7 11.24 24.3 11.24 26.55 10.6L31.4 21.8H14.6L19.45 10.6Z"
        fill="url(#pkStudioPenCone)"
        stroke="rgba(15, 23, 42, 0.14)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {/* Curved specular rib on cone */}
      <path d="M20.3 11.4L16.5 21.2H18.4L21.4 11.5Z" fill="rgba(255, 255, 255, 0.72)" />
      {/* Brushed satin-aluminum collar */}
      <path
        d="M14.45 21.8H31.55L31.9 24.6H14.1L14.45 21.8Z"
        fill="url(#pkStudioPenFerrule)"
        stroke="rgba(15, 23, 42, 0.12)"
        strokeWidth="0.65"
      />
      {/* Sculpted matte-ceramic barrel deeply rooted into dock rim */}
      <path
        d="M14.1 24.6H31.9V80H14.1V24.6Z"
        fill="url(#pkStudioPenBarrel)"
        stroke="rgba(15, 23, 42, 0.12)"
        strokeWidth="0.7"
      />
      {/* Cylindrical live-color ink band + wrap highlight */}
      <rect x="14.1" y="27.2" width="17.8" height="5.2" fill={color} opacity="0.94" />
      <rect x="14.1" y="27.2" width="17.8" height="5.2" fill="url(#pkStudioCylWrap)" />
      <rect x="14.2" y="33.9" width="17.6" height="1.15" rx="0.55" fill={color} opacity="0.35" />
      {/* Recessed live-size indicator jewel */}
      <circle cx="23" cy="41.4" r={gaugeRadius} fill={color} opacity="0.88" />
      <circle cx={22.4} cy={40.8} r={Math.max(0.65, gaugeRadius * 0.34)} fill="rgba(255,255,255,0.55)" />
      {/* Silky studio cylinder specular strip */}
      <rect x="16.8" y="25.4" width="2.4" height="53.6" rx="1.2" fill="rgba(255, 255, 255, 0.42)" />
      <defs>
        <linearGradient id="pkStudioPenCone" x1="14.6" y1="16" x2="31.4" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D7E0EB" />
          <stop offset="0.28" stopColor="#FFFFFF" />
          <stop offset="0.65" stopColor="#F4F7FA" />
          <stop offset="0.9" stopColor="#C7D3E0" />
          <stop offset="1" stopColor="#DCE4EE" />
        </linearGradient>
        <linearGradient id="pkStudioPenFerrule" x1="14.1" y1="23.2" x2="31.9" y2="23.2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BAC6D2" />
          <stop offset="0.3" stopColor="#F8FAFC" />
          <stop offset="0.66" stopColor="#DCE3EC" />
          <stop offset="1" stopColor="#9EADB9" />
        </linearGradient>
        <linearGradient id="pkStudioPenBarrel" x1="14.1" y1="37" x2="31.9" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DCE4EE" />
          <stop offset="0.28" stopColor="#FFFFFF" />
          <stop offset="0.64" stopColor="#F8FAFC" />
          <stop offset="0.9" stopColor="#CED8E4" />
          <stop offset="1" stopColor="#E1E8F0" />
        </linearGradient>
        <linearGradient id="pkStudioCylWrap" x1="14.1" y1="29.8" x2="31.9" y2="29.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(15, 23, 42, 0.18)" />
          <stop offset="0.28" stopColor="rgba(255, 255, 255, 0.34)" />
          <stop offset="0.62" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="0.9" stopColor="rgba(15, 23, 42, 0.2)" />
          <stop offset="1" stopColor="rgba(255, 255, 255, 0.1)" />
        </linearGradient>
      </defs>
    </svg>
  );
});

const AppleHighlighterNibSvg = React.memo<{ color: string; sizeLevel: number }>(
  ({ color, sizeLevel }) => {
    const ribbonHeight = Math.max(2.6, Math.min(6.4, 2.6 + ((sizeLevel - 5) / 95) * 3.8));
    const ribbonY = 36.8 - ribbonHeight / 2;

    return (
      <svg className="apple-nib-svg" viewBox="0 0 46 80" fill="none" aria-hidden="true">
        {/* Authentic beveled chisel felt tip */}
        <path
          d="M15.4 8.6L29.6 4.2C30.45 3.94 31.3 4.52 31.36 5.4L31.8 15.6H14.2L14.78 9.8C14.86 9.22 15.08 8.76 15.4 8.6Z"
          fill={color}
          opacity="0.94"
          stroke="rgba(15, 23, 42, 0.16)"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {/* Crisp chisel bevel highlight */}
        <path d="M15.9 9.0L29.4 4.8L30.45 7.1L16.05 11.4Z" fill="rgba(255, 255, 255, 0.44)" />
        <rect x="14.3" y="14.5" width="17.4" height="1.1" fill="rgba(15, 23, 42, 0.12)" />
        {/* Sculpted ergonomic marker shoulder */}
        <path
          d="M13.2 15.6H32.8L35.2 22.8H10.8L13.2 15.6Z"
          fill="url(#pkStudioHlShoulder)"
          stroke="rgba(15, 23, 42, 0.12)"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {/* Machined satin neck collar */}
        <rect
          x="10.7"
          y="21.9"
          width="24.6"
          height="2.1"
          rx="0.7"
          fill="url(#pkStudioHlRing)"
          stroke="rgba(15, 23, 42, 0.11)"
          strokeWidth="0.6"
        />
        {/* Broad matte-porcelain highlighter body deeply rooted into dock rim */}
        <path
          d="M10.8 24H35.2V80H10.8V24Z"
          fill="url(#pkStudioHlBarrel)"
          stroke="rgba(15, 23, 42, 0.12)"
          strokeWidth="0.7"
        />
        {/* Satin-translucent colored grip sleeve + studio cylinder gloss */}
        <path
          d="M10.8 29.4C10.8 28.18 11.78 27.2 13 27.2H33C34.22 27.2 35.2 28.18 35.2 29.4V80H10.8V29.4Z"
          fill={color}
          opacity="0.86"
        />
        <path
          d="M10.8 29.4C10.8 28.18 11.78 27.2 13 27.2H33C34.22 27.2 35.2 28.18 35.2 29.4V80H10.8V29.4Z"
          fill="url(#pkStudioHlSleeveGloss)"
        />
        {/* Clean live chisel-width indicator ribbon */}
        <path
          d={`M16.2 ${ribbonY + 1.1}L30.2 ${ribbonY - 0.8}L29.5 ${ribbonY + ribbonHeight - 0.8}L15.5 ${ribbonY + ribbonHeight + 1.1}Z`}
          fill="rgba(255, 255, 255, 0.86)"
        />
        {/* Porcelain vertical sheen */}
        <rect x="14.1" y="24.8" width="2.6" height="54.2" rx="1.3" fill="rgba(255, 255, 255, 0.34)" />
        <defs>
          <linearGradient id="pkStudioHlShoulder" x1="10.8" y1="19.2" x2="35.2" y2="19.2" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D7E0EB" />
            <stop offset="0.3" stopColor="#FFFFFF" />
            <stop offset="0.66" stopColor="#F5F7FA" />
            <stop offset="0.9" stopColor="#C8D4E1" />
            <stop offset="1" stopColor="#DCE4EE" />
          </linearGradient>
          <linearGradient id="pkStudioHlRing" x1="10.7" y1="22.95" x2="35.3" y2="22.95" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BAC6D2" />
            <stop offset="0.32" stopColor="#F8FAFC" />
            <stop offset="0.68" stopColor="#DCE3EC" />
            <stop offset="1" stopColor="#A0AEBC" />
          </linearGradient>
          <linearGradient id="pkStudioHlBarrel" x1="10.8" y1="37" x2="35.2" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DCE4EE" />
            <stop offset="0.28" stopColor="#FFFFFF" />
            <stop offset="0.64" stopColor="#F8FAFC" />
            <stop offset="0.9" stopColor="#CED8E4" />
            <stop offset="1" stopColor="#E1E8F0" />
          </linearGradient>
          <linearGradient id="pkStudioHlSleeveGloss" x1="10.8" y1="36.3" x2="35.2" y2="36.3" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(15, 23, 42, 0.14)" />
            <stop offset="0.26" stopColor="rgba(255, 255, 255, 0.36)" />
            <stop offset="0.6" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="0.9" stopColor="rgba(15, 23, 42, 0.16)" />
            <stop offset="1" stopColor="rgba(255, 255, 255, 0.1)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
);

const AppleLaserStylusSvg = React.memo<{
  color: string;
  sizeLevel: number;
  isActive: boolean;
}>(({ color, sizeLevel, isActive }) => {
  const haloRadius = (isActive ? 7.6 : 5.6) + ((sizeLevel - 5) / 95) * 1.4;

  return (
    <svg className="apple-nib-svg" viewBox="0 0 46 80" fill="none" aria-hidden="true">
      {/* Pure-gradient optical aura around glass lens (no SVG blur filter) */}
      <circle
        cx="23"
        cy="8.2"
        r={haloRadius}
        fill="url(#pkStudioLaserHalo)"
        opacity={isActive ? 0.85 : 0.45}
      />
      <circle cx="23" cy="8.2" r={haloRadius * 0.56} fill={color} opacity={isActive ? 0.28 : 0.16} />
      {/* Precision glass optical emitter lens */}
      <circle cx="23" cy="8.2" r="3.45" fill={color} stroke="rgba(15, 23, 42, 0.22)" strokeWidth="0.6" />
      <circle cx="22.1" cy="7.3" r="1.15" fill="#FFFFFF" opacity="0.96" />
      {/* Chamfered brushed-titanium emitter crown */}
      <path
        d="M17.4 12.6H28.6L31.2 21.4H14.8L17.4 12.6Z"
        fill="url(#pkStudioLaserCrown)"
        stroke="rgba(15, 23, 42, 0.18)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <line x1="16.4" y1="16.9" x2="29.6" y2="16.9" stroke="rgba(15, 23, 42, 0.14)" strokeWidth="0.7" />
      {/* Anodized Space-Gray aluminum presenter barrel deeply rooted into dock rim */}
      <path
        d="M14.8 21.4H31.2V80H14.8V21.4Z"
        fill="url(#pkStudioLaserBody)"
        stroke="rgba(15, 23, 42, 0.24)"
        strokeWidth="0.7"
      />
      {/* Recessed color-matched optical accent ring */}
      <rect x="14.8" y="24.6" width="16.4" height="3" fill={color} opacity="0.94" />
      <rect x="14.8" y="24.6" width="16.4" height="3" fill="url(#pkStudioLaserRingSheen)" />
      {/* Flush machined pill presenter trigger */}
      <rect
        x="19.8"
        y="31.8"
        width="6.4"
        height="12.6"
        rx="3.2"
        fill="url(#pkStudioLaserBtn)"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="0.75"
      />
      <circle cx="23" cy="36.2" r="1.35" fill={color} opacity={isActive ? 0.98 : 0.72} />
      {/* Anodized specular strip */}
      <rect x="17.2" y="22.4" width="2.1" height="56.6" rx="1.05" fill="rgba(255, 255, 255, 0.14)" />
      <defs>
        <radialGradient
          id="pkStudioLaserHalo"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(23 8.2) rotate(90) scale(8.8)"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.78" />
          <stop offset="0.38" stopColor={color} stopOpacity="0.42" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pkStudioLaserCrown" x1="14.8" y1="17" x2="31.2" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B5C1CE" />
          <stop offset="0.3" stopColor="#F8FAFC" />
          <stop offset="0.66" stopColor="#D6DEE8" />
          <stop offset="0.92" stopColor="#8E9DAD" />
          <stop offset="1" stopColor="#B0BCC9" />
        </linearGradient>
        <linearGradient id="pkStudioLaserBody" x1="14.8" y1="35.7" x2="31.2" y2="35.7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" />
          <stop offset="0.28" stopColor="#64748B" />
          <stop offset="0.58" stopColor="#475569" />
          <stop offset="0.88" stopColor="#1E293B" />
          <stop offset="1" stopColor="#3B485A" />
        </linearGradient>
        <linearGradient id="pkStudioLaserRingSheen" x1="14.8" y1="26.1" x2="31.2" y2="26.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(0,0,0,0.2)" />
          <stop offset="0.3" stopColor="rgba(255,255,255,0.36)" />
          <stop offset="0.9" stopColor="rgba(0,0,0,0.22)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.1)" />
        </linearGradient>
        <linearGradient id="pkStudioLaserBtn" x1="19.8" y1="38.1" x2="26.2" y2="38.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" />
          <stop offset="0.38" stopColor="#64748B" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
    </svg>
  );
});

const AppleEraserNibSvg = React.memo<{ sizeLevel: number }>(({ sizeLevel }) => {
  const gaugeWidth = Math.max(5.6, Math.min(12.8, 5.6 + ((sizeLevel - 5) / 95) * 7.2));

  return (
    <svg className="apple-nib-svg" viewBox="0 0 46 80" fill="none" aria-hidden="true">
      {/* Iconic rounded architectural rubber eraser head */}
      <path
        d="M13.6 10C13.6 6.7 16.2 4.5 19.5 4.5H26.5C29.8 4.5 32.4 6.7 32.4 10V21.8H13.6V10Z"
        fill="url(#pkStudioEraserRubber)"
        stroke="rgba(190, 24, 93, 0.2)"
        strokeWidth="0.7"
      />
      {/* Top crown satin highlight */}
      <path
        d="M15.4 8.3C16.05 6.6 17.5 5.65 19.5 5.65H26.5C28.1 5.65 29.4 6.2 30.15 7.4C28.05 7.95 25.55 8.3 23 8.3C20.2 8.3 17.6 8.6 15.4 8.3Z"
        fill="rgba(255, 255, 255, 0.58)"
      />
      <rect x="15.8" y="8.9" width="2.3" height="11.4" rx="1.15" fill="rgba(255, 255, 255, 0.4)" />
      {/* Brushed satin-aluminum ferrule band */}
      <rect
        x="12.5"
        y="21.4"
        width="21"
        height="6.1"
        rx="1.4"
        fill="url(#pkStudioEraserFerrule)"
        stroke="rgba(15, 23, 42, 0.13)"
        strokeWidth="0.7"
      />
      <line x1="13.2" y1="23.5" x2="32.8" y2="23.5" stroke="rgba(15, 23, 42, 0.12)" strokeWidth="0.65" />
      <line x1="13.2" y1="25.5" x2="32.8" y2="25.5" stroke="rgba(15, 23, 42, 0.1)" strokeWidth="0.65" />
      {/* Matte-porcelain architectural sleeve deeply rooted into dock rim */}
      <path
        d="M12.6 27.5H33.4V80H12.6V27.5Z"
        fill="url(#pkStudioEraserSleeve)"
        stroke="rgba(15, 23, 42, 0.12)"
        strokeWidth="0.7"
      />
      {/* Live-size blush gauge pill */}
      <rect
        x={23 - gaugeWidth / 2}
        y="36.8"
        width={gaugeWidth}
        height="3.2"
        rx="1.6"
        fill="#E11D48"
        opacity="0.74"
      />
      <rect x="15.6" y="28.6" width="2.5" height="50.4" rx="1.25" fill="rgba(255, 255, 255, 0.38)" />
      <defs>
        <linearGradient id="pkStudioEraserRubber" x1="13.6" y1="13.2" x2="32.4" y2="13.2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2B8CE" />
          <stop offset="0.3" stopColor="#FFF7FA" />
          <stop offset="0.66" stopColor="#FCDCE8" />
          <stop offset="0.9" stopColor="#E397B4" />
          <stop offset="1" stopColor="#EEB4CA" />
        </linearGradient>
        <linearGradient id="pkStudioEraserFerrule" x1="12.5" y1="24.45" x2="33.5" y2="24.45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BAC6D2" />
          <stop offset="0.32" stopColor="#F8FAFC" />
          <stop offset="0.68" stopColor="#DCE3EC" />
          <stop offset="1" stopColor="#9EADB9" />
        </linearGradient>
        <linearGradient id="pkStudioEraserSleeve" x1="12.6" y1="38.75" x2="33.4" y2="38.75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DCE4EE" />
          <stop offset="0.28" stopColor="#FFFFFF" />
          <stop offset="0.64" stopColor="#F8FAFC" />
          <stop offset="0.9" stopColor="#CED8E4" />
          <stop offset="1" stopColor="#E1E8F0" />
        </linearGradient>
      </defs>
    </svg>
  );
});

/**
 * Single Unified External Dock Thickness Roller (5%..100% in 20 crisp 5% magnetic detents).
 * Sits directly on the floating dock exterior and dynamically adapts to whichever tool is active
 * (Pen, Highlighter, Laser, or Eraser) while keeping each tool's saved thickness independent.
 * - Tap anywhere along the recessed track to snap immediately to that 5% stop
 * - Glide horizontally in natural Arabic RTL flow (٥٪ right -> ١٠٠٪ left) in one smooth sweep
 * - Roll mouse wheel anywhere over the roller to step +/-5% without scrolling the Mushaf
 * - Shows a crisp floating true-scale live tip preview while adjusting
 */
const DOCK_ROLLER_INSET_PX = 8;

const DEFAULT_SLOT_LEVELS: Record<SizableAnnotationTool, [number, number, number]> = {
  pen: [15, 25, 50],
  highlighter: [20, 35, 65],
  eraser: [15, 30, 60],
};

const TOOL_SHORT_NAMES: Record<SizableAnnotationTool, string> = {
  pen: 'القلم',
  highlighter: 'التظليل',
  eraser: 'الممحاة',
};

const TOOL_SIZE_TITLES: Record<SizableAnnotationTool, string> = {
  pen: 'سُمك القلم',
  highlighter: 'عرض التظليل',
  eraser: 'حجم الممحاة',
};

const SLOT_INDICES: readonly SizeSlotIndex[] = [0, 1, 2];

function renderSlotPreviewStage(
  tool: SizableAnnotationTool,
  color: string,
  realPx: number
): React.ReactNode {
  if (tool === 'pen') {
    return (
      <span
        className="apple-size-dot"
        style={{
          width: `${Math.max(2, Math.round(realPx))}px`,
          height: `${Math.max(2, Math.round(realPx))}px`,
          backgroundColor: color,
        }}
      />
    );
  }
  if (tool === 'highlighter') {
    return (
      <span className="apple-callout-hl-stage">
        <span className="apple-callout-hl-lines" />
        <span
          className="apple-callout-hl-bar"
          style={{
            height: `${Math.max(6, Math.min(26, Math.round(realPx * 0.48)))}px`,
            backgroundColor: color,
          }}
        />
      </span>
    );
  }
  return (
    <span
      className="apple-eraser-preview"
      style={{
        width: `${Math.max(9, Math.min(28, Math.round(realPx * 0.44)))}px`,
        height: `${Math.max(9, Math.min(28, Math.round(realPx * 0.44)))}px`,
      }}
    />
  );
}

interface CalmMagneticSliderProps {
  value: number;
  defaultValue?: number;
  min: number;
  max: number;
  step?: number;
  magnetStep?: number;
  ariaLabel: string;
  ariaValueText?: string;
  onActivate?: () => void;
  onChange: (nextVal: number) => void;
}

/**
 * Unified calm RTL slider with smooth 1% drag, double-click default reset,
 * and magnetic 5-degree detents (5, 10, 15, 20...).
 * Used consistently across thickness, pen opacity, and highlighter transparency controls.
 */
const CalmMagneticSlider: React.FC<CalmMagneticSliderProps> = ({
  value,
  defaultValue,
  min,
  max,
  step = SIZE_DIAL_STEP,
  magnetStep = 5,
  ariaLabel,
  ariaValueText,
  onActivate,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const trackRectRef = useRef<DOMRect | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const dragRatioRef = useRef<number | null>(null);
  const lockedAnchorRef = useRef<number | null>(null);
  const dragSpeedRef = useRef<number>(0.25);
  const lastSampleRef = useRef<{ x: number; t: number } | null>(null);
  const wheelAccumRef = useRef(0);

  const valueRef = useRef(value);
  valueRef.current = value;

  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  const pulseHapticDetent = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(4);
      }
    } catch {
      // Ignore vibration permission/support restrictions
    }
  }, []);

  const commitValue = useCallback(
    (nextVal: number) => {
      onActivateRef.current?.();
      const clamped = Math.max(min, Math.min(max, Math.round(nextVal)));
      if (clamped !== valueRef.current) {
        valueRef.current = clamped;
        onChangeRef.current(clamped);
      }
    },
    [min, max]
  );

  const stepToAnchor = useCallback(
    (dir: number) => {
      const cur = valueRef.current;
      const next =
        dir > 0
          ? Math.min(max, (Math.floor(cur / magnetStep) + 1) * magnetStep)
          : Math.max(min, (Math.ceil(cur / magnetStep) - 1) * magnetStep);
      commitValue(next);
    },
    [min, max, magnetStep, commitValue]
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY;
      if (primaryDelta === 0) return;

      if (Math.abs(primaryDelta) >= 34) {
        wheelAccumRef.current = 0;
        stepToAnchor(primaryDelta > 0 ? 1 : -1);
        return;
      }

      wheelAccumRef.current += primaryDelta;
      const threshold = 18;
      if (Math.abs(wheelAccumRef.current) >= threshold) {
        const dir = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        stepToAnchor(dir);
      }
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [stepToAnchor]);

  const updateFromClientX = useCallback(
    (clientX: number, immediateCommit: boolean) => {
      const trackEl = trackRef.current;
      if (!trackEl) return;
      const rect = trackRectRef.current ?? trackEl.getBoundingClientRect();
      const usable = Math.max(1, rect.width - DOCK_ROLLER_INSET_PX * 2);
      const progress = Math.max(
        0,
        Math.min(1, (rect.right - DOCK_ROLLER_INSET_PX - clientX) / usable)
      );
      const rawVal = min + progress * (max - min);
      const prevLockedAnchor = lockedAnchorRef.current;
      const { value: snappedVal, visualValue, lockedAnchor } = applyMagneticSnap(rawVal, min, max, {
        magnetStep,
        lockedAnchor: prevLockedAnchor,
        dragSpeedPxPerMs: dragSpeedRef.current,
      });
      lockedAnchorRef.current = lockedAnchor;

      if (lockedAnchor !== null && lockedAnchor !== prevLockedAnchor && snappedVal !== valueRef.current) {
        pulseHapticDetent();
      }

      const visualRatio = Math.max(0, Math.min(1, (visualValue - min) / Math.max(1, max - min)));

      dragRatioRef.current = visualRatio;
      trackEl.style.setProperty('--dial-ratio', visualRatio.toFixed(4));

      if (immediateCommit) {
        if (dragRafRef.current !== null) {
          window.cancelAnimationFrame(dragRafRef.current);
          dragRafRef.current = null;
        }
        pendingValueRef.current = null;
        commitValue(snappedVal);
        return;
      }

      pendingValueRef.current = snappedVal;
      if (dragRafRef.current === null) {
        dragRafRef.current = window.requestAnimationFrame(() => {
          dragRafRef.current = null;
          const nextNow = pendingValueRef.current;
          pendingValueRef.current = null;
          if (nextNow !== null) {
            commitValue(nextNow);
          }
        });
      }
    },
    [min, max, magnetStep, commitValue, pulseHapticDetent]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.focus({ preventScroll: true });
    trackRectRef.current = e.currentTarget.getBoundingClientRect();
    lockedAnchorRef.current = null;
    dragSpeedRef.current = 0.25;
    lastSampleRef.current = { x: e.clientX, t: performance.now() };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic capture errors
    }
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);
    updateFromClientX(e.clientX, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    const now = performance.now();
    const prevSample = lastSampleRef.current;
    if (prevSample) {
      const dx = Math.abs(e.clientX - prevSample.x);
      const dt = Math.max(1, now - prevSample.t);
      if (dx >= 0.4) {
        const instantSpeed = dx / dt;
        dragSpeedRef.current = 0.35 * instantSpeed + 0.65 * dragSpeedRef.current;
        lastSampleRef.current = { x: e.clientX, t: now };
      }
    } else {
      lastSampleRef.current = { x: e.clientX, t: now };
    }
    updateFromClientX(e.clientX, false);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    updateFromClientX(e.clientX, true);
    activePointerIdRef.current = null;
    trackRectRef.current = null;
    dragRatioRef.current = null;
    lockedAnchorRef.current = null;
    dragSpeedRef.current = 0.25;
    lastSampleRef.current = null;
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore capture release errors
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const arrowDelta = e.shiftKey ? 1 : step;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      commitValue(value + arrowDelta);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      commitValue(value - arrowDelta);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      commitValue(value + step * 3);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      commitValue(value - step * 3);
    } else if (e.key === 'Home') {
      e.preventDefault();
      commitValue(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      commitValue(max);
    }
  };

  const handleDoubleClick = () => {
    if (defaultValue === undefined) return;
    pulseHapticDetent();
    commitValue(defaultValue);
  };

  const ratio = Math.max(0, Math.min(1, (value - min) / Math.max(1, max - min)));
  const activeRatio = isDragging && dragRatioRef.current !== null ? dragRatioRef.current : ratio;

  return (
    <div
      ref={trackRef}
      className={`apple-dock-roller-track ${isDragging ? 'is-dragging' : ''}`}
      style={{ '--dial-ratio': activeRatio.toFixed(4) } as React.CSSProperties}
      dir="rtl"
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={ariaValueText}
      title={defaultValue !== undefined ? 'اسحب أو نقرتان للإرجاع الافتراضي' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="apple-dock-roller-fill" aria-hidden="true" />
      <div className="apple-dock-roller-thumb" aria-hidden="true" />
    </div>
  );
};

interface DockThicknessSlotsProps {
  tool: SizableAnnotationTool;
  isStandby: boolean;
  isPulsing: boolean;
  suppressPreview: boolean;
  sizeSlots: [number, number, number];
  activeSlot: SizeSlotIndex;
  editingSlot: SizeSlotIndex | null;
  color: string;
  onActivateTool: () => void;
  onSelectSlot: (slot: SizeSlotIndex) => void;
  onEditingSlotChange: (slot: SizeSlotIndex | null) => void;
  onChangeSlotLevel: (slot: SizeSlotIndex, nextLevel: number) => void;
}

const DockThicknessSlots: React.FC<DockThicknessSlotsProps> = ({
  tool,
  isStandby,
  isPulsing,
  suppressPreview,
  sizeSlots,
  activeSlot,
  editingSlot,
  color,
  onActivateTool,
  onSelectSlot,
  onEditingSlotChange,
  onChangeSlotLevel,
}) => {
  const [transientSlot, setTransientSlot] = useState<SizeSlotIndex | null>(null);

  const slotsTrayRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<number | null>(null);
  const wheelAccumRef = useRef(0);
  const wheelSlotRef = useRef<SizeSlotIndex | null>(null);

  const slotLevels: [number, number, number] = [
    pxToSizeLevel(tool, sizeSlots[0]),
    pxToSizeLevel(tool, sizeSlots[1]),
    pxToSizeLevel(tool, sizeSlots[2]),
  ];

  const slotLevelsRef = useRef(slotLevels);
  slotLevelsRef.current = slotLevels;

  const isStandbyRef = useRef(isStandby);
  isStandbyRef.current = isStandby;

  const onActivateToolRef = useRef(onActivateTool);
  onActivateToolRef.current = onActivateTool;

  const onChangeSlotLevelRef = useRef(onChangeSlotLevel);
  onChangeSlotLevelRef.current = onChangeSlotLevel;

  const flashSlotCallout = useCallback((slot: SizeSlotIndex) => {
    setTransientSlot(slot);
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = window.setTimeout(() => {
      setTransientSlot(null);
      previewTimerRef.current = null;
    }, 760);
  }, []);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  const commitSlotLevel = useCallback(
    (slot: SizeSlotIndex, nextRaw: number, showTransient = false, snapToStep = false) => {
      if (isStandbyRef.current) {
        onActivateToolRef.current();
      }
      const nextLevel = snapToStep ? snapSizeLevel(nextRaw) : clampSizeLevel(nextRaw);
      if (nextLevel !== slotLevelsRef.current[slot]) {
        onChangeSlotLevelRef.current(slot, nextLevel);
      }
      if (showTransient) {
        flashSlotCallout(slot);
      }
    },
    [flashSlotCallout]
  );

  // Native non-passive wheel listener over the 3 external dot buttons (steps +/-5%)
  useEffect(() => {
    const el = slotsTrayRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const slotBtnHit =
        e.target instanceof Element ? e.target.closest<HTMLElement>('[data-slot-index]') : null;
      if (!slotBtnHit) return;
      const idxAttr = slotBtnHit.dataset.slotIndex;
      if (idxAttr === undefined) return;
      const slotIdx = Number(idxAttr) as SizeSlotIndex;
      if (slotIdx !== 0 && slotIdx !== 1 && slotIdx !== 2) return;

      e.preventDefault();
      e.stopPropagation();

      const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY;
      if (primaryDelta === 0) return;

      if (wheelSlotRef.current !== slotIdx) {
        wheelSlotRef.current = slotIdx;
        wheelAccumRef.current = 0;
      }

      if (Math.abs(primaryDelta) >= 36) {
        wheelAccumRef.current = 0;
        const dir = primaryDelta > 0 ? 1 : -1;
        commitSlotLevel(slotIdx, slotLevelsRef.current[slotIdx] + dir * SIZE_DIAL_STEP, true, true);
        return;
      }

      wheelAccumRef.current += primaryDelta;
      const threshold = 22;
      if (Math.abs(wheelAccumRef.current) >= threshold) {
        const steps = Math.trunc(wheelAccumRef.current / threshold);
        wheelAccumRef.current -= steps * threshold;
        commitSlotLevel(
          slotIdx,
          slotLevelsRef.current[slotIdx] + steps * SIZE_DIAL_STEP,
          true,
          true
        );
      }
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [commitSlotLevel]);

  const handleSlotClick = (idx: SizeSlotIndex) => {
    if (isStandby) {
      onSelectSlot(idx);
      onActivateTool();
      onEditingSlotChange(null);
      return;
    }
    if (activeSlot !== idx) {
      onSelectSlot(idx);
      if (editingSlot !== null) {
        onEditingSlotChange(idx);
      }
      return;
    }
    onEditingSlotChange(editingSlot === idx ? null : idx);
  };

  const handleSlotContextMenu = (e: React.MouseEvent, idx: SizeSlotIndex) => {
    e.preventDefault();
    if (isStandby) {
      onActivateTool();
    }
    onSelectSlot(idx);
    onEditingSlotChange(idx);
  };

  const accentColor = tool === 'eraser' ? '#EC4899' : color;
  const calloutSlot = editingSlot === null ? transientSlot : null;
  const showCallout = !suppressPreview && calloutSlot !== null;

  const editorLevel = editingSlot !== null ? slotLevels[editingSlot] : SIZE_DIAL_MIN;
  const editorRealPx = editingSlot !== null ? sizeLevelToPx(tool, editorLevel) : 4;

  return (
    <div
      ref={slotsTrayRef}
      className={`apple-thickness-slots ${isStandby ? 'is-standby' : ''} ${
        isPulsing ? 'is-pulsing' : ''
      }`}
      style={{ '--dial-accent': accentColor } as React.CSSProperties}
      role="group"
      aria-label={`نقاط سُمك ${TOOL_SHORT_NAMES[tool]} الثلاثة`}
    >
      {/* Transient wheel preview callout when scrolling directly over a dot */}
      <div className="apple-dock-roller-callout-anchor" aria-hidden="true">
        <AnimatePresence>
          {showCallout && calloutSlot !== null && (
            <motion.div
              className="apple-dock-roller-callout"
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="apple-roller-callout-stage">
                {renderSlotPreviewStage(tool, color, sizeLevelToPx(tool, slotLevels[calloutSlot]))}
              </div>
              <span className="apple-roller-callout-pct">
                {toArabicDigits(slotLevels[calloutSlot])}٪
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Individual Slot Thickness Editor Popover */}
      <div className="apple-slot-editor-anchor">
        <AnimatePresence>
          {editingSlot !== null && (
            <motion.div
              className="apple-slot-editor-popover"
              role="dialog"
              aria-label={`ضبط سُمك ${toArabicDigits(editingSlot + 1)} لأداة ${TOOL_SHORT_NAMES[tool]}`}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="apple-slot-editor-head">
                <div className="apple-roller-callout-stage">
                  {renderSlotPreviewStage(tool, color, editorRealPx)}
                </div>
                <span className="apple-roller-callout-pct">{toArabicDigits(editorLevel)}٪</span>
              </div>

              <CalmMagneticSlider
                value={editorLevel}
                defaultValue={DEFAULT_SLOT_LEVELS[tool][editingSlot]}
                min={SIZE_DIAL_MIN}
                max={SIZE_DIAL_MAX}
                step={SIZE_DIAL_STEP}
                magnetStep={5}
                ariaLabel={`${TOOL_SIZE_TITLES[tool]} ${toArabicDigits(editingSlot + 1)} من ٥٪ إلى ١٠٠٪`}
                ariaValueText={`${TOOL_SIZE_TITLES[tool]} ${toArabicDigits(editorLevel)} بالمئة`}
                onActivate={() => {
                  if (isStandbyRef.current) {
                    onActivateToolRef.current();
                  }
                }}
                onChange={(nextLvl) => commitSlotLevel(editingSlot, nextLvl, false, false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3 Pure Clean Proportional Dot Buttons (uniform circle shape across tools, no numbers) */}
      <div className="apple-thickness-slots-group">
        {SLOT_INDICES.map((idx) => {
          const level = slotLevels[idx];
          const ratio = (level - SIZE_DIAL_MIN) / (SIZE_DIAL_MAX - SIZE_DIAL_MIN);
          const dotSizePx = Math.round(5 + ratio * 12);
          const isSelected = !isStandby && activeSlot === idx;
          const isEditingThis = editingSlot === idx;
          const slotNumAr = toArabicDigits(idx + 1);
          const levelAr = toArabicDigits(level);
          return (
            <button
              key={idx}
              type="button"
              data-slot-index={idx}
              className={`apple-thickness-slot-btn ${isSelected ? 'is-active' : ''} ${
                isEditingThis ? 'is-editing' : ''
              }`}
              aria-pressed={isSelected}
              aria-expanded={isEditingThis}
              onClick={() => handleSlotClick(idx)}
              onContextMenu={(e) => handleSlotContextMenu(e, idx)}
              title={
                isSelected
                  ? `${TOOL_SIZE_TITLES[tool]} ${slotNumAr} (${levelAr}٪) · اضغط مجدداً لضبط هذا المقاس أو اسحب بالعجلة`
                  : `${TOOL_SIZE_TITLES[tool]} ${slotNumAr} (${levelAr}٪) · اختصار (${idx + 1}) · كليك يمين للتعديل`
              }
              aria-label={`${TOOL_SIZE_TITLES[tool]} ${slotNumAr}: ${levelAr} بالمئة`}
            >
              <span
                className="apple-thickness-slot-dot"
                style={{ width: `${dotSizePx}px`, height: `${dotSizePx}px` }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const COLOR_TOOL_TITLES: Record<ColorableAnnotationTool, string> = {
  pen: 'لون القلم',
  highlighter: 'لون التظليل',
  laser: 'لون الليزر',
};

const COLOR_SLOT_INDICES: readonly ColorSlotIndex[] = [0, 1, 2];

interface DockColorSlotsProps {
  tool: ColorableAnnotationTool;
  isStandby: boolean;
  isHidden?: boolean;
  colorSlots: [string, string, string];
  activeSlot: ColorSlotIndex;
  editingSlot: ColorSlotIndex | null;
  palette: readonly ColorSwatch[];
  onActivateTool: () => void;
  onSelectSlot: (slot: ColorSlotIndex) => void;
  onEditingSlotChange: (slot: ColorSlotIndex | null) => void;
  onChangeSlotColor: (slot: ColorSlotIndex, hex: string) => void;
}

const DockColorSlots: React.FC<DockColorSlotsProps> = ({
  tool,
  isStandby,
  isHidden = false,
  colorSlots,
  activeSlot,
  editingSlot,
  palette,
  onActivateTool,
  onSelectSlot,
  onEditingSlotChange,
  onChangeSlotColor,
}) => {
  const handleSlotClick = (idx: ColorSlotIndex) => {
    if (isHidden) return;
    if (isStandby) {
      onSelectSlot(idx);
      onActivateTool();
      onEditingSlotChange(null);
      return;
    }
    if (activeSlot !== idx) {
      onSelectSlot(idx);
      if (editingSlot !== null) {
        onEditingSlotChange(idx);
      }
      return;
    }
    onEditingSlotChange(editingSlot === idx ? null : idx);
  };

  const handleSlotContextMenu = (e: React.MouseEvent, idx: ColorSlotIndex) => {
    e.preventDefault();
    if (isHidden) return;
    if (isStandby) {
      onActivateTool();
    }
    onSelectSlot(idx);
    onEditingSlotChange(idx);
  };

  const resolveColorName = (hex: string) =>
    palette.find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.label ?? hex;

  return (
    <div
      className={`apple-color-slots ${isStandby ? 'is-standby' : ''} ${
        isHidden ? 'is-hidden' : ''
      }`}
      role="group"
      aria-label={`ألوان ${COLOR_TOOL_TITLES[tool]} الثلاثة`}
      aria-hidden={isHidden}
    >
      <div className="apple-color-editor-anchor">
        <AnimatePresence>
          {!isHidden && editingSlot !== null && (
            <motion.div
              className="apple-color-editor-popover"
              role="dialog"
              aria-label={`تغيير ${COLOR_TOOL_TITLES[tool]} (${toArabicDigits(editingSlot + 1)})`}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="apple-swatch-row" role="group" aria-label="اختيار لون الخانة">
                {palette.map((swatch) => {
                  const isCurrent =
                    colorSlots[editingSlot].toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      className={`apple-swatch-btn ${isCurrent ? 'is-selected' : ''}`}
                      style={{ '--swatch-hex': swatch.hex } as React.CSSProperties}
                      onClick={() => {
                        onChangeSlotColor(editingSlot, swatch.hex);
                        onEditingSlotChange(null);
                      }}
                      title={swatch.label}
                      aria-label={swatch.label}
                      aria-pressed={isCurrent}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="apple-color-slots-group">
        {COLOR_SLOT_INDICES.map((idx) => {
          const hex = colorSlots[idx];
          const isSelected = !isStandby && activeSlot === idx;
          const isEditingThis = editingSlot === idx;
          const slotNumAr = toArabicDigits(idx + 1);
          const colorLabel = resolveColorName(hex);
          return (
            <button
              key={idx}
              type="button"
              disabled={isHidden}
              tabIndex={isHidden ? -1 : 0}
              className={`apple-color-slot-btn ${isSelected ? 'is-active' : ''} ${
                isEditingThis ? 'is-editing' : ''
              }`}
              style={{ '--slot-color': hex } as React.CSSProperties}
              aria-pressed={isSelected}
              aria-expanded={!isHidden && isEditingThis}
              onClick={() => handleSlotClick(idx)}
              onContextMenu={(e) => handleSlotContextMenu(e, idx)}
              title={
                isSelected
                  ? `${colorLabel} · اضغط مجدداً لتبديل اللون`
                  : `${colorLabel} · كليك يمين لتخصيص الخانة ${slotNumAr}`
              }
              aria-label={`${COLOR_TOOL_TITLES[tool]} ${slotNumAr}: ${colorLabel}`}
            >
              <span className="apple-color-slot-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TOOL_LABELS: Record<AnnotationTool, string> = {
  cursor: 'تصفح',
  pen: 'قلم أبل',
  highlighter: 'تظليل أبل',
  laser: 'ليزر ضوئي',
  eraser: 'ممحاة',
};

export const FloatingAnnotationPalette: React.FC = () => {
  const {
    activeTool,
    isPaletteOpen,
    penSettings,
    highlighterSettings,
    laserSettings,
    eraserSettings,
    selectedStrokeAnchor,
    shortcutFeedback,
  } = useAnnotationToolState();
  const { canUndo, canRedo, hasActiveStrokes } = useAnnotationDockState();
  const {
    setActiveTool,
    setPaletteOpen,
    updatePenSettings,
    updateHighlighterSettings,
    updateLaserSettings,
    updateEraserSettings,
    updateStroke,
    removeStrokes,
    duplicateStroke,
    undo,
    redo,
    clearSurface,
  } = useAnnotationActions();

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SizeSlotIndex | null>(null);
  const [editingColorSlot, setEditingColorSlot] = useState<ColorSlotIndex | null>(null);
  const [lastSizableTool, setLastSizableTool] = useState<SizableAnnotationTool>('pen');
  const [lastColorableTool, setLastColorableTool] = useState<ColorableAnnotationTool>('pen');
  const [isRollerPulsing, setIsRollerPulsing] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dockRootRef = useRef<HTMLDivElement>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const hasInspectorOptions =
    activeTool === 'pen' ||
    activeTool === 'highlighter' ||
    activeTool === 'laser' ||
    activeTool === 'eraser';

  const triggerRollerPulse = useCallback(() => {
    setIsRollerPulsing(true);
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setIsRollerPulsing(false);
      pulseTimerRef.current = null;
    }, 360);
  }, []);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  // Remember the most recently active sizable & colorable tools so the 3 external slots adapt cleanly
  // and wake that tool automatically if clicked from Browse mode.
  useEffect(() => {
    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      setLastSizableTool(activeTool);
    }
    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'laser') {
      setLastColorableTool(activeTool);
    }
    setEditingSlot(null);
    setEditingColorSlot(null);
  }, [activeTool]);

  // Close popovers when switching to cursor/eraser or collapsing dock
  useEffect(() => {
    if (!hasInspectorOptions || !isPaletteOpen) {
      setIsInspectorOpen(false);
    }
    if (!isPaletteOpen) {
      setEditingSlot(null);
      setEditingColorSlot(null);
    }
  }, [hasInspectorOptions, isPaletteOpen]);

  // Close popovers on outside pointerdown (capture phase so drawing surfaces calling stopPropagation still dismiss it) or Escape key
  useEffect(() => {
    if (!isInspectorOpen && editingSlot === null && editingColorSlot === null) {
      return;
    }
    const onOutside = (e: PointerEvent) => {
      const dockEl = dockRootRef.current;
      if (!dockEl) return;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const isInsideDock =
        path.length > 0
          ? path.includes(dockEl)
          : Boolean(e.target instanceof Node && dockEl.contains(e.target));
      if (!isInsideDock) {
        setIsInspectorOpen(false);
        setEditingSlot(null);
        setEditingColorSlot(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.key === 'Escape') {
        setIsInspectorOpen(false);
        setEditingSlot(null);
        setEditingColorSlot(null);
      }
    };
    window.addEventListener('pointerdown', onOutside, { capture: true });
    window.addEventListener('keydown', onEsc, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', onOutside, { capture: true });
      window.removeEventListener('keydown', onEsc, { capture: true });
    };
  }, [isInspectorOpen, editingSlot, editingColorSlot]);

  const clampDragOffset = useCallback((rawX: number, rawY: number) => {
    const dockW = dockRootRef.current?.offsetWidth ?? 560;
    const maxX = Math.max(0, (window.innerWidth - dockW) * 0.5 - 16);
    const maxUp = Math.max(0, window.innerHeight - 108);
    return {
      x: Math.max(-maxX, Math.min(maxX, rawX)),
      y: Math.max(-maxUp, Math.min(10, rawY)),
    };
  }, []);

  // Keep dragged palette safely inside viewport on window resize
  useEffect(() => {
    const clampOnResize = () => {
      setDragOffset((prev) => {
        if (prev.x === 0 && prev.y === 0) return prev;
        return clampDragOffset(prev.x, prev.y);
      });
    };
    window.addEventListener('resize', clampOnResize);
    return () => window.removeEventListener('resize', clampOnResize);
  }, [clampDragOffset]);

  const handleSelectTool = (tool: AnnotationTool) => {
    setEditingSlot(null);
    setEditingColorSlot(null);
    if (tool === 'cursor') {
      setActiveTool(tool);
      setIsInspectorOpen(false);
      return;
    }
    if (activeTool === tool) {
      // Second tap on active Pen / Highlighter / Laser / Eraser toggles its options inspector
      setIsInspectorOpen((prev) => !prev);
      if (tool === 'eraser') {
        triggerRollerPulse();
      }
    } else {
      setActiveTool(tool);
      setIsInspectorOpen(false);
    }
  };

  const handleDragStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: dragOffset.x,
      originY: dragOffset.y,
    };
  };

  const handleDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    setDragOffset(clampDragOffset(drag.originX + dx, drag.originY + dy));
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragStartRef.current = null;
    setIsDragging(false);
    // Gentle center & edge snap on release
    setDragOffset((prev) => {
      const clamped = clampDragOffset(prev.x, prev.y);
      return Math.abs(clamped.x) < 18 ? { ...clamped, x: 0 } : clamped;
    });
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }
  };

  const activeAccentColor =
    activeTool === 'pen'
      ? penSettings.color
      : activeTool === 'highlighter'
      ? highlighterSettings.color
      : activeTool === 'laser'
      ? laserSettings.color
      : '#007AFF';

  const penSizeLevel = pxToSizeLevel('pen', penSettings.size);
  const highlighterSizeLevel = pxToSizeLevel('highlighter', highlighterSettings.size);
  const eraserSizeLevel = pxToSizeLevel('eraser', eraserSettings.size);

  // External 3-slot thickness dots adapt to Pen / Highlighter / Eraser (or stay ready in standby on Browse / Laser)
  const rollerTool: SizableAnnotationTool =
    activeTool === 'cursor' || activeTool === 'laser'
      ? lastSizableTool
      : activeTool;

  const currentSlots: [number, number, number] =
    rollerTool === 'pen'
      ? penSettings.sizeSlots
      : rollerTool === 'highlighter'
      ? highlighterSettings.sizeSlots
      : eraserSettings.sizeSlots;

  const currentActiveSlot: SizeSlotIndex =
    rollerTool === 'pen'
      ? penSettings.activeSizeSlot
      : rollerTool === 'highlighter'
      ? highlighterSettings.activeSizeSlot
      : eraserSettings.activeSizeSlot;

  const rollerColor =
    rollerTool === 'pen'
      ? penSettings.color
      : rollerTool === 'highlighter'
      ? highlighterSettings.color
      : '#EC4899';

  const handleSelectSizeSlot = useCallback(
    (slot: SizeSlotIndex) => {
      if (rollerTool === 'pen') {
        updatePenSettings({ activeSizeSlot: slot });
      } else if (rollerTool === 'highlighter') {
        updateHighlighterSettings({ activeSizeSlot: slot });
      } else {
        updateEraserSettings({ activeSizeSlot: slot });
      }
    },
    [rollerTool, updatePenSettings, updateHighlighterSettings, updateEraserSettings]
  );

  const handleChangeSlotLevel = useCallback(
    (slot: SizeSlotIndex, lvl: number) => {
      const nextPx = sizeLevelToPx(rollerTool, lvl);
      const applyPatch = (slots: [number, number, number]): [number, number, number] => {
        const copy: [number, number, number] = [slots[0], slots[1], slots[2]];
        copy[slot] = nextPx;
        return copy;
      };
      if (rollerTool === 'pen') {
        updatePenSettings({ sizeSlots: applyPatch(penSettings.sizeSlots) });
      } else if (rollerTool === 'highlighter') {
        updateHighlighterSettings({ sizeSlots: applyPatch(highlighterSettings.sizeSlots) });
      } else {
        updateEraserSettings({ sizeSlots: applyPatch(eraserSettings.sizeSlots) });
      }
    },
    [
      rollerTool,
      penSettings.sizeSlots,
      highlighterSettings.sizeSlots,
      eraserSettings.sizeSlots,
      updatePenSettings,
      updateHighlighterSettings,
      updateEraserSettings,
    ]
  );

  const colorTool: ColorableAnnotationTool =
    activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'laser'
      ? activeTool
      : lastColorableTool;

  const currentColorSlots: [string, string, string] =
    colorTool === 'pen'
      ? penSettings.colorSlots
      : colorTool === 'highlighter'
      ? highlighterSettings.colorSlots
      : laserSettings.colorSlots;

  const currentActiveColorSlot: ColorSlotIndex =
    colorTool === 'pen'
      ? penSettings.activeColorSlot
      : colorTool === 'highlighter'
      ? highlighterSettings.activeColorSlot
      : laserSettings.activeColorSlot;

  const currentColorPalette: readonly ColorSwatch[] =
    colorTool === 'pen'
      ? APPLE_PEN_COLORS
      : colorTool === 'highlighter'
      ? APPLE_HIGHLIGHTER_COLORS
      : APPLE_LASER_COLORS;

  const handleSelectColorSlot = useCallback(
    (slot: ColorSlotIndex) => {
      if (colorTool === 'pen') {
        updatePenSettings({ activeColorSlot: slot });
      } else if (colorTool === 'highlighter') {
        updateHighlighterSettings({ activeColorSlot: slot });
      } else {
        updateLaserSettings({ activeColorSlot: slot });
      }
    },
    [colorTool, updatePenSettings, updateHighlighterSettings, updateLaserSettings]
  );

  const handleChangeSlotColor = useCallback(
    (slot: ColorSlotIndex, hex: string) => {
      const applyPatch = (slots: [string, string, string]): [string, string, string] => {
        const copy: [string, string, string] = [slots[0], slots[1], slots[2]];
        copy[slot] = hex;
        return copy;
      };
      if (colorTool === 'pen') {
        updatePenSettings({ colorSlots: applyPatch(penSettings.colorSlots) });
      } else if (colorTool === 'highlighter') {
        updateHighlighterSettings({ colorSlots: applyPatch(highlighterSettings.colorSlots) });
      } else {
        updateLaserSettings({ colorSlots: applyPatch(laserSettings.colorSlots) });
      }
    },
    [
      colorTool,
      penSettings.colorSlots,
      highlighterSettings.colorSlots,
      laserSettings.colorSlots,
      updatePenSettings,
      updateHighlighterSettings,
      updateLaserSettings,
    ]
  );

  const hasOpenPopover =
    isPaletteOpen &&
    (isInspectorOpen || editingSlot !== null || editingColorSlot !== null);

  const previewStrokeWidth = Math.max(1.5, Math.min(10.5, penSettings.size * 0.8));
  const previewDashArray =
    penSettings.lineStyle === 'dashed'
      ? `${(previewStrokeWidth * 2.5).toFixed(1)} ${(previewStrokeWidth * 1.9).toFixed(1)}`
      : penSettings.lineStyle === 'dotted'
      ? `0.1 ${(previewStrokeWidth * 2.15).toFixed(1)}`
      : undefined;

  const selectedQuickColors =
    activeTool === 'highlighter' ? highlighterSettings.colorSlots : penSettings.colorSlots;

  const selectedBarCoords = (() => {
    if (!selectedStrokeAnchor || typeof window === 'undefined') return null;
    const minLeft = 104;
    const maxLeft = Math.max(minLeft, window.innerWidth - 104);
    const left = Math.max(minLeft, Math.min(maxLeft, selectedStrokeAnchor.centerX));
    const placeBelow = selectedStrokeAnchor.topY < 86;
    const rawTop = placeBelow
      ? selectedStrokeAnchor.bottomY + 10
      : selectedStrokeAnchor.topY - 10;
    const top = Math.max(20, Math.min(window.innerHeight - 64, rawTop));
    return { left, top, placeBelow };
  })();

  return (
    <div className="apple-annotation-portal" data-annotation-ui="true" dir="rtl">
      {/* Floating Quick-Action Mini-Bar above/below any selected stroke or shape */}
      <AnimatePresence>
        {selectedStrokeAnchor && selectedBarCoords && (
          <motion.div
            key={selectedStrokeAnchor.strokeId}
            className={`apple-selected-stroke-bar ${selectedBarCoords.placeBelow ? 'is-below' : 'is-above'}`}
            style={{
              left: `${Math.round(selectedBarCoords.left)}px`,
              top: `${Math.round(selectedBarCoords.top)}px`,
            }}
            role="toolbar"
            aria-label="إجراءات العنصر المحدد"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="apple-selected-bar-colors">
              {selectedQuickColors.map((hex, idx) => (
                <button
                  key={`${hex}-${idx}`}
                  type="button"
                  className="apple-selected-bar-dot"
                  style={{ '--dot-hex': hex } as React.CSSProperties}
                  aria-label="تغيير اللون"
                  title="تبديل لون العنصر المحدد"
                  onClick={() =>
                    updateStroke(
                      selectedStrokeAnchor.surfaceId,
                      selectedStrokeAnchor.strokeId,
                      (st) => ({ ...st, color: hex }),
                      true
                    )
                  }
                />
              ))}
            </div>
            <span className="apple-selected-bar-sep" aria-hidden="true" />
            <button
              type="button"
              className="apple-selected-bar-btn"
              title="تكرار العنصر"
              aria-label="تكرار العنصر المحدد"
              onClick={() =>
                duplicateStroke(selectedStrokeAnchor.surfaceId, selectedStrokeAnchor.strokeId)
              }
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="apple-selected-bar-btn is-danger"
              title="حذف (Delete)"
              aria-label="حذف العنصر المحدد"
              onClick={() =>
                removeStrokes(selectedStrokeAnchor.surfaceId, [selectedStrokeAnchor.strokeId])
              }
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.9} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle transient HUD toast when a keyboard shortcut executes */}
      <AnimatePresence>
        {shortcutFeedback && (
          <motion.div
            key={shortcutFeedback.seq}
            className={`apple-shortcut-toast ${
              hasOpenPopover ? 'is-top' : isPaletteOpen ? 'is-above-dock' : 'is-bottom'
            }`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="apple-shortcut-toast-label">{shortcutFeedback.label}</span>
            <kbd className="apple-shortcut-toast-key" dir="ltr">
              {shortcutFeedback.keycap}
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isPaletteOpen ? (
          <motion.button
            key="launcher"
            type="button"
            className={`apple-palette-launcher ${activeTool !== 'cursor' ? 'is-armed' : ''}`}
            onClick={() => setPaletteOpen(true)}
            title="فتح منظومة الأقلام والتظليل والليزر"
            aria-label="فتح منظومة الأقلام والتظليل والليزر"
            initial={{ opacity: 0, scale: 0.86, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.86, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={
              activeTool !== 'cursor'
                ? ({ '--armed-color': activeAccentColor } as React.CSSProperties)
                : undefined
            }
          >
            <PenTool className="w-5 h-5" strokeWidth={2.1} aria-hidden="true" />
            <span className="apple-launcher-label">الأقلام</span>
          </motion.button>
        ) : (
          <div
            key="dock"
            ref={dockRootRef}
            className={`apple-palette-anchor ${isDragging ? 'is-dragging' : ''}`}
            style={{
              transform: `translate3d(calc(-50% + ${dragOffset.x}px), ${dragOffset.y}px, 0)`,
            }}
          >
            <motion.div
              className="apple-palette-motion-shell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Contextual Apple PencilKit Inspector Popover */}
              <div className="apple-inspector-anchor">
                <AnimatePresence>
                  {isInspectorOpen && hasInspectorOptions && (
                    <motion.div
                      className="apple-inspector-popover"
                      role="dialog"
                      aria-label={`إعدادات ${TOOL_LABELS[activeTool]}`}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                  {/* Pen Preview + Opacity + Line Style + Smart Shapes + Scribble Erase */}
                  {activeTool === 'pen' && (
                    <>
                      <div className="apple-inspector-preview" aria-hidden="true">
                        <svg viewBox="0 0 180 34" className="apple-inspector-preview-svg" fill="none">
                          <path
                            d="M14 23 C 46 6, 74 30, 108 16 C 134 5, 152 22, 166 13"
                            stroke={penSettings.color}
                            strokeOpacity={penSettings.opacity}
                            strokeWidth={previewStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={previewDashArray}
                          />
                        </svg>
                      </div>

                      <div className="apple-inspector-section">
                        <div className="apple-slider-head">
                          <span>الكثافة</span>
                          <span className="apple-slider-val">
                            {toArabicDigits(Math.round(penSettings.opacity * 100))}٪
                          </span>
                        </div>
                        <CalmMagneticSlider
                          value={Math.round(penSettings.opacity * 100)}
                          defaultValue={96}
                          min={35}
                          max={100}
                          step={5}
                          magnetStep={5}
                          ariaLabel="كثافة حبر القلم"
                          ariaValueText={`${toArabicDigits(Math.round(penSettings.opacity * 100))} بالمئة`}
                          onChange={(val) => updatePenSettings({ opacity: val / 100 })}
                        />
                      </div>

                      <div className="apple-inspector-section">
                        <div className="apple-segmented is-three" role="group" aria-label="نمط خط القلم">
                          <button
                            type="button"
                            className={`apple-seg-btn apple-line-style-btn ${
                              penSettings.lineStyle === 'solid' ? 'is-active' : ''
                            }`}
                            onClick={() => updatePenSettings({ lineStyle: 'solid' })}
                            title="خط متصل"
                          >
                            <svg width="24" height="6" viewBox="0 0 24 6" aria-hidden="true">
                              <line x1="2" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                            <span>متصل</span>
                          </button>
                          <button
                            type="button"
                            className={`apple-seg-btn apple-line-style-btn ${
                              penSettings.lineStyle === 'dashed' ? 'is-active' : ''
                            }`}
                            onClick={() => updatePenSettings({ lineStyle: 'dashed' })}
                            title="خط متقطع"
                          >
                            <svg width="24" height="6" viewBox="0 0 24 6" aria-hidden="true">
                              <line x1="2" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 4" />
                            </svg>
                            <span>متقطع</span>
                          </button>
                          <button
                            type="button"
                            className={`apple-seg-btn apple-line-style-btn ${
                              penSettings.lineStyle === 'dotted' ? 'is-active' : ''
                            }`}
                            onClick={() => updatePenSettings({ lineStyle: 'dotted' })}
                            title="خط منقط"
                          >
                            <svg width="24" height="6" viewBox="0 0 24 6" aria-hidden="true">
                              <line x1="3" y1="3" x2="21" y2="3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 5" />
                            </svg>
                            <span>منقط</span>
                          </button>
                        </div>
                      </div>

                      <div className="apple-inspector-toggle-row">
                        <span className="apple-toggle-title">ضبط الأشكال</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={penSettings.smartShapes}
                          className={`apple-switch ${penSettings.smartShapes ? 'is-on' : ''}`}
                          onClick={() =>
                            updatePenSettings({ smartShapes: !penSettings.smartShapes })
                          }
                        >
                          <span className="apple-switch-knob" />
                        </button>
                      </div>

                      <div className="apple-inspector-toggle-row">
                        <span className="apple-toggle-title">شطب للمسح السريع</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={penSettings.scribbleErase}
                          className={`apple-switch ${penSettings.scribbleErase ? 'is-on' : ''}`}
                          onClick={() =>
                            updatePenSettings({ scribbleErase: !penSettings.scribbleErase })
                          }
                        >
                          <span className="apple-switch-knob" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Highlighter Preview + Transparency + Straight Assist */}
                  {activeTool === 'highlighter' && (
                    <>
                      <div className="apple-inspector-preview is-highlighter" aria-hidden="true">
                        <div className="apple-preview-text-lines" />
                        <svg viewBox="0 0 180 34" className="apple-inspector-preview-svg" fill="none">
                          <path
                            d="M24 18 L 156 16"
                            stroke={highlighterSettings.color}
                            strokeOpacity={highlighterSettings.opacity}
                            strokeWidth={Math.max(8, Math.min(20, highlighterSettings.size * 0.44))}
                            strokeLinecap="round"
                            style={{ mixBlendMode: 'multiply' }}
                          />
                        </svg>
                      </div>

                      <div className="apple-inspector-section">
                        <div className="apple-slider-head">
                          <span>الشفافية</span>
                          <span className="apple-slider-val">
                            {toArabicDigits(Math.round(highlighterSettings.opacity * 100))}٪
                          </span>
                        </div>
                        <CalmMagneticSlider
                          value={Math.round(highlighterSettings.opacity * 100)}
                          defaultValue={56}
                          min={20}
                          max={90}
                          step={5}
                          magnetStep={5}
                          ariaLabel="شفافية قلم التظليل"
                          ariaValueText={`${toArabicDigits(Math.round(highlighterSettings.opacity * 100))} بالمئة`}
                          onChange={(val) => updateHighlighterSettings({ opacity: val / 100 })}
                        />
                      </div>

                      <div className="apple-inspector-toggle-row">
                        <span className="apple-toggle-title">استقامة الأشكال</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={highlighterSettings.straightAssist}
                          className={`apple-switch ${highlighterSettings.straightAssist ? 'is-on' : ''}`}
                          onClick={() =>
                            updateHighlighterSettings({
                              straightAssist: !highlighterSettings.straightAssist,
                            })
                          }
                        >
                          <span className="apple-switch-knob" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Optical Laser Mode */}
                  {activeTool === 'laser' && (
                    <div className="apple-inspector-section">
                      <div className="apple-segmented" role="group" aria-label="نمط مؤشر الليزر">
                        <button
                          type="button"
                          className={`apple-seg-btn ${laserSettings.mode === 'trail' ? 'is-active' : ''}`}
                          onClick={() => updateLaserSettings({ mode: 'trail' })}
                        >
                          شعاع متلاشٍ
                        </button>
                        <button
                          type="button"
                          className={`apple-seg-btn ${laserSettings.mode === 'dot' ? 'is-active' : ''}`}
                          onClick={() => updateLaserSettings({ mode: 'dot' })}
                        >
                          نقطة فقط
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Smart Eraser Mode */}
                  {activeTool === 'eraser' && (
                    <div className="apple-inspector-section">
                      <div className="apple-slider-head">
                        <span>وضع المسح</span>
                      </div>
                      <div className="apple-segmented" role="group" aria-label="وضع الممحاة">
                        <button
                          type="button"
                          className={`apple-seg-btn ${eraserSettings.mode === 'stroke' ? 'is-active' : ''}`}
                          onClick={() => updateEraserSettings({ mode: 'stroke' })}
                        >
                          عنصر كامل
                        </button>
                        <button
                          type="button"
                          className={`apple-seg-btn ${eraserSettings.mode === 'partial' ? 'is-active' : ''}`}
                          onClick={() => updateEraserSettings({ mode: 'partial' })}
                        >
                          مسح جزئي
                        </button>
                      </div>
                    </div>
                  )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            {/* Main Floating Apple PencilKit Dock */}
            <div className="apple-palette-dock" role="toolbar" aria-label="منظومة الأقلام والتظليل والليزر">
              {/* Zone 1: Drag Handle + Browse Mode */}
              <button
                type="button"
                className="apple-dock-drag-handle"
                title="اسحب لنقل شريط الأقلام · نقرتان لإعادته للمنتصف"
                aria-label="سحب شريط الأقلام"
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                onDoubleClick={() => setDragOffset({ x: 0, y: 0 })}
              >
                <GripVertical className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
              </button>

              <button
                type="button"
                className={`apple-cursor-btn ${activeTool === 'cursor' ? 'is-active' : ''}`}
                aria-pressed={activeTool === 'cursor'}
                onClick={() => handleSelectTool('cursor')}
                title="وضع التصفح العادي"
                aria-label="وضع التصفح العادي"
              >
                <MousePointer2 className="w-4 h-4" strokeWidth={1.95} aria-hidden="true" />
                <span className="apple-cursor-label">تصفح</span>
              </button>

              <div className="apple-dock-divider" aria-hidden="true" />

              {/* Zone 2: Clean Minimal Static Tool Nibs */}
              <div className="apple-nibs-tray" role="group" aria-label="أدوات الرسم والمؤشر">
                <button
                  type="button"
                  className={`apple-nib-slot ${activeTool === 'pen' ? 'is-active' : ''}`}
                  style={{ '--slot-accent': penSettings.color } as React.CSSProperties}
                  aria-pressed={activeTool === 'pen'}
                  onClick={() => handleSelectTool('pen')}
                  title="قلم أبل · اضغط مجدداً للإعدادات · كليك يمين لتحريك الأشكال"
                  aria-label="قلم أبل"
                >
                  <ApplePenNibSvg color={penSettings.color} sizeLevel={penSizeLevel} />
                </button>

                <button
                  type="button"
                  className={`apple-nib-slot ${activeTool === 'highlighter' ? 'is-active' : ''}`}
                  style={{ '--slot-accent': highlighterSettings.color } as React.CSSProperties}
                  aria-pressed={activeTool === 'highlighter'}
                  onClick={() => handleSelectTool('highlighter')}
                  title="تظليل أبل · اضغط مجدداً للشفافية وضبط الأشكال · كليك يمين لتحريك الأشكال"
                  aria-label="تظليل أبل"
                >
                  <AppleHighlighterNibSvg
                    color={highlighterSettings.color}
                    sizeLevel={highlighterSizeLevel}
                  />
                </button>

                <button
                  type="button"
                  className={`apple-nib-slot ${activeTool === 'laser' ? 'is-active' : ''}`}
                  style={{ '--slot-accent': laserSettings.color } as React.CSSProperties}
                  aria-pressed={activeTool === 'laser'}
                  onClick={() => handleSelectTool('laser')}
                  title="مؤشر ليزر ضوئي (L) · سمك موزون ثابت · اضغط مجدداً لنمط الشعاع"
                  aria-label="مؤشر ليزر ضوئي"
                >
                  <AppleLaserStylusSvg
                    color={laserSettings.color}
                    sizeLevel={28}
                    isActive={activeTool === 'laser'}
                  />
                </button>

                <button
                  type="button"
                  className={`apple-nib-slot ${activeTool === 'eraser' ? 'is-active' : ''}`}
                  style={{ '--slot-accent': '#E11D48' } as React.CSSProperties}
                  aria-pressed={activeTool === 'eraser'}
                  onClick={() => handleSelectTool('eraser')}
                  title="ممحاة ذكية (E) · اضغط مجدداً لاختيار وضع المسح الكامل أو الجزئي"
                  aria-label="ممحاة ذكية"
                >
                  <AppleEraserNibSvg sizeLevel={eraserSizeLevel} />
                </button>
              </div>

              <div className="apple-dock-divider" aria-hidden="true" />

              {/* Zone 3: 3 Independent Thickness Dots + 3 Quick Color Circles */}
              <DockThicknessSlots
                tool={rollerTool}
                isStandby={activeTool === 'cursor' || activeTool === 'laser'}
                isPulsing={isRollerPulsing}
                suppressPreview={isInspectorOpen || editingColorSlot !== null}
                sizeSlots={currentSlots}
                activeSlot={currentActiveSlot}
                editingSlot={editingSlot}
                color={rollerColor}
                onActivateTool={() => setActiveTool(rollerTool)}
                onSelectSlot={handleSelectSizeSlot}
                onEditingSlotChange={(nextSlot) => {
                  if (nextSlot !== null) {
                    setIsInspectorOpen(false);
                    setEditingColorSlot(null);
                  }
                  setEditingSlot(nextSlot);
                }}
                onChangeSlotLevel={handleChangeSlotLevel}
              />

              <DockColorSlots
                tool={colorTool}
                isStandby={activeTool === 'cursor'}
                isHidden={activeTool === 'eraser'}
                colorSlots={currentColorSlots}
                activeSlot={currentActiveColorSlot}
                editingSlot={editingColorSlot}
                palette={currentColorPalette}
                onActivateTool={() => setActiveTool(colorTool)}
                onSelectSlot={handleSelectColorSlot}
                onEditingSlotChange={(nextSlot) => {
                  if (nextSlot !== null) {
                    setIsInspectorOpen(false);
                    setEditingSlot(null);
                  }
                  setEditingColorSlot(nextSlot);
                }}
                onChangeSlotColor={handleChangeSlotColor}
              />

              <div className="apple-dock-divider" aria-hidden="true" />

              {/* Zone 4: History & Collapse */}
              <div className="apple-dock-actions" role="group" aria-label="التراجع والمسح">
                <button
                  type="button"
                  className="apple-icon-btn"
                  disabled={!canUndo}
                  onClick={() => undo()}
                  title="تراجع خطوة · للشكل المضبوط: مرة للرسم الحر ومرتان للمسح"
                  aria-label="تراجع عن آخر خطوة"
                >
                  <Undo2 className="w-4 h-4" strokeWidth={1.9} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="apple-icon-btn"
                  disabled={!canRedo}
                  onClick={() => redo()}
                  title="إعادة الخطوة"
                  aria-label="إعادة الخطوة"
                >
                  <Redo2 className="w-4 h-4" strokeWidth={1.9} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="apple-icon-btn is-danger"
                  disabled={!hasActiveStrokes}
                  onClick={() => clearSurface()}
                  title="مسح رسومات الصفحة الحالية"
                  aria-label="مسح رسومات الصفحة الحالية"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.9} aria-hidden="true" />
                </button>
              </div>

              <div className="apple-dock-divider" aria-hidden="true" />

              <div className="apple-dock-utility" role="group" aria-label="طي الشريط">
                <button
                  type="button"
                  className="apple-icon-btn is-collapse"
                  onClick={() => {
                    setIsInspectorOpen(false);
                    setEditingSlot(null);
                    setEditingColorSlot(null);
                    setPaletteOpen(false);
                  }}
                  title="طيّ شريط الأقلام"
                  aria-label="طيّ شريط الأقلام"
                >
                  <ChevronDown className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
