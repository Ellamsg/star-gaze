/** The three steps in the public booking flow. */
export type BookingStep = 0 | 1 | 2;

/** A bookable day built from the open slots returned by the API. */
export type DayOption = {
  id: string;
  weekday: string;
  day: string;
  month: string;
};
