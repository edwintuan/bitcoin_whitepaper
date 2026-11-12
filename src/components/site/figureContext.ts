import { createContext, useContext } from 'react';

export interface FigureApi {
  /** Index of the guided step being shown, or null once the reader explores freely. */
  step: number | null;
  /** Number of guided steps. */
  total: number;
  goTo(step: number | null): void;
  /** False while the figure is off screen or the tab is hidden: pause all work. */
  active: boolean;
  /** The reader asked the system for less motion. */
  reducedMotion: boolean;
}

/**
 * What a figure is told by the frame around it.
 *
 * It lives in a module of its own on purpose. Figures are loaded lazily; if
 * the context were created in FigureFrame.tsx, a hot update of that file
 * during development would give later-loaded figures a second context, and
 * they would silently fall back to these defaults.
 */
export const FigureContext = createContext<FigureApi>({
  step: null,
  total: 0,
  goTo: () => {},
  active: true,
  reducedMotion: false,
});

/** The walkthrough step, visibility and motion preference for the figure being drawn. */
export const useFigure = () => useContext(FigureContext);
