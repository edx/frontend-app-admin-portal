import { ReactNode } from 'react';

export interface TourStep {
  target: string;
  // Spotlight a different element than the popup anchors to.
  overlayTarget?: string;
  // Cap the spotlight width to a left fraction (0–1) of the overlay element.
  overlayWidthRatio?: number;
  // Selector whose top edge extends the spotlight upward.
  overlayTopTarget?: string;
  // Spotlight padding override (px); defaults to CheckpointOverlay's padding.
  overlayPadding?: number;
  // Full Popper placement set (incl. `-start` / `-end` variants, e.g. `top-start`).
  placement:
  | 'top' | 'top-start' | 'top-end'
  | 'right' | 'right-start' | 'right-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end';
  title?: ReactNode;
  body: ReactNode;
  onAdvance?: (advanceEventName: string) => void;
  onBack?: (backEventName: string) => void;
  onEnd?: (endEventName: string, flowUuid?: string) => void;
}

export interface TourFlow {
  [key: string]: TourStep;
}
