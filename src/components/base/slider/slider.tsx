"use client";

import type { ReactNode } from "react";
import {
  Label as AriaLabel,
  Slider as AriaSlider,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
} from "react-aria-components";
import type { SliderProps as AriaSliderProps } from "react-aria-components";
import { cx } from "@/utils/cx";

type SliderValue = number | number[];

type SliderBaseProps<T extends SliderValue> = Omit<
  AriaSliderProps<T>,
  "children" | "className" | "orientation"
> & {
  /** Optional visible label associated with every thumb. */
  label?: ReactNode;
  /** Show the exact value in a persistent bubble above each thumb. Default `true`. */
  showTooltip?: boolean;
  /** Custom visual formatter for the value bubbles. */
  formatValue?: (value: number, index: number) => ReactNode;
  className?: string;
};

export type SliderProps = SliderBaseProps<number> & {
  /** Accessible name for the single thumb. */
  thumbLabel?: string;
};

export type RangeSliderProps = SliderBaseProps<number[]> & {
  /** Accessible names for the lower and upper thumbs. */
  thumbLabels?: [string, string];
};

type SliderBaseInternalProps<T extends SliderValue> = SliderBaseProps<T> & {
  thumbLabels: string[];
};

/**
 * Shared single and multi-thumb slider presentation.
 *
 * React Aria owns the value model, drag behavior, hidden range inputs,
 * keyboard controls, RTL handling, and collision rules. BoardUI owns the
 * visual track, selected range, thumbs, and exact-value bubbles.
 */
function SliderBase<T extends SliderValue>({
  className,
  label,
  showTooltip = false,
  formatValue,
  thumbLabels,
  ...props
}: SliderBaseInternalProps<T>) {
  return (
    <AriaSlider
      {...props}
      orientation="horizontal"
      className={({ isDisabled }) =>
        cx(
          "group flex w-full min-w-0 flex-col gap-2",
          isDisabled && "cursor-not-allowed opacity-50",
          className,
        )
      }
    >
      {({ state }) => {
        const isRange = state.values.length > 1;
        const startPercent = isRange ? state.getThumbPercent(0) : 0;
        const endPercent = state.getThumbPercent(state.values.length - 1);

        return (
          <>
            {label != null && (
              <AriaLabel className="label">
                {label}
              </AriaLabel>
            )}

            <AriaSliderTrack
              className={cx(
                "relative h-8 w-full touch-none",
                showTooltip && "mt-8",
              )}
            >
              {({ isHovered }) => (
                <>
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-1/2 end-0 start-0 h-[3px] -translate-y-1/2 bg-ink",
                      isHovered && "bg-ink",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-1/2 h-[9px] -translate-y-1/2 bg-orange",
                    )}
                    style={{
                      insetInlineStart: `${startPercent * 100}%`,
                      insetInlineEnd: `${(1 - endPercent) * 100}%`,
                    }}
                  />

                  {state.values.map((value, index) => {
                    const valueLabel =
                      formatValue?.(value, index) ??
                      state.getThumbValueLabel(index);

                    return (
                      <AriaSliderThumb
                        key={index}
                        index={index}
                        aria-label={
                          thumbLabels[index] ??
                          (isRange ? `Value ${index + 1}` : "Value")
                        }
                        className={({
                          isDragging,
                          isHovered: isThumbHovered,
                          isFocusVisible,
                          isDisabled,
                        }) =>
                          cx(
                            "top-1/2 h-6 w-3 bg-ink outline-none",
                            "flex items-center justify-center",
                            "transition-[scale] duration-150 ease-out",
                            isThumbHovered && !isDragging && "scale-110",
                            isDragging && "z-20 scale-125",
                            isFocusVisible && "ring-2 ring-border-focus-ring ring-offset-2",
                            isDisabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
                          )
                        }
                      >
                        {({ isDragging, isFocused }) => (
                          <>
                            {showTooltip && (
                              <span
                                aria-hidden
                                className={cx(
                                  "pointer-events-none absolute bottom-[calc(100%+9px)] left-1/2 -translate-x-1/2",
                                  "flex h-6 min-w-8 items-center justify-center bg-ink px-2 font-mono text-[11px] whitespace-nowrap text-cream",
                                  "transition-[translate] duration-150 ease-out",
                                  (isDragging || isFocused) && "-translate-y-0.5",
                                )}
                              >
                                {valueLabel}
                                <span
                                  aria-hidden
                                  className="absolute -bottom-[3px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 bg-ink"
                                />
                              </span>
                            )}
                            <span
                              aria-hidden
                              className={cx(
                                "hidden",
                              )}
                            />
                          </>
                        )}
                      </AriaSliderThumb>
                    );
                  })}
                </>
              )}
            </AriaSliderTrack>
          </>
        );
      }}
    </AriaSlider>
  );
}

/** A single-value slider with an exact-value bubble above the thumb. */
export function Slider({ thumbLabel = "Value", ...props }: SliderProps) {
  return <SliderBase {...props} thumbLabels={[thumbLabel]} />;
}

/** A two-thumb slider for selecting a minimum and maximum value. */
export function RangeSlider({
  thumbLabels = ["Minimum", "Maximum"],
  ...props
}: RangeSliderProps) {
  return <SliderBase {...props} thumbLabels={thumbLabels} />;
}
