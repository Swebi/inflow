export const EVENT_COLORS = {
  LIGHT_BLUE: "1", // #a4bdfc
  LIGHT_GREEN: "2", // #7ae7bf
  LIGHT_PURPLE: "3", // #dbadff
  LIGHT_RED: "4", // #ff887c
  YELLOW: "5", // #fbd75b
  ORANGE: "6", // #ffb878
  CYAN: "7", // #46d6db
  LIGHT_GRAY: "8", // #e1e1e1
  BLUE: "9", // #5484ed
  GREEN: "10", // #51b749
  RED: "11", // #dc2127
} as const;

export type EventColorKey = keyof typeof EVENT_COLORS;
export type EventColorId = (typeof EVENT_COLORS)[EventColorKey];

export const DEFAULT_TIMEZONE = "UTC";

export const APP_IDENTIFIER = "inflow";
