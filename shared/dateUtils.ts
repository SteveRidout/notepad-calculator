import { WholeDate } from "./types";

export const monthDisplayString = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const HOUR = 1000 * 60 * 60;
export const DAY = 24 * HOUR;
export const YEAR = 365.25 * DAY;

export const dateToUTCWholeDate = (date: Date): WholeDate => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

export const wholeDateToUTCDate = (wholeDate: WholeDate): Date =>
  new Date(Date.UTC(wholeDate.year, wholeDate.month - 1, wholeDate.day));

export const secondsSinceEpoch = (date: Date) =>
  Math.floor(date.getTime() / 1000);

export const wholeDatesEqual = (a: WholeDate, b: WholeDate) =>
  a.year === b.year && a.month === b.month && a.day === b.day;

export const dateToMonthDisplayString = (date: Date) =>
  monthDisplayString[date.getMonth()];
