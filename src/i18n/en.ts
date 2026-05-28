import type { Messages } from "./messages";

export const en: Messages = {
  appTitle: "iCaroon — Import ics",

  fileDropHint: "Select an .ics file or drag and drop it here.",
  fileDropArea: "Click to choose / drop file here",

  parsedSummary: "{fileName}: {total} events ({ok} to register / {skip} skipped)",
  registerButton: "Register {count} events",
  cancel: "Cancel",

  registering: "Registering… {done} / {total}",

  doneSummary: "Done: {success} succeeded / {failed} failed / {skipped} skipped",
  failedItem: "[Failed] {subject}: {message}",
  skippedItem: "[Skipped] {subject}: {reason}",
  tryAgain: "Try again",

  colSubject: "Subject",
  colStart: "Start",
  colEnd: "End",
  colAllDay: "All day",
  colStatus: "Status",
  statusOk: "OK",
  endNone: "(none)",

  wholeFile: "(entire file)",
  noVevent: "(no VEVENT)",
  noVeventReason: "No VEVENT found",
  parseFailure: "Failed to parse ics: {reason}",
  untitled: "(untitled)",
  rruleUnsupported: "Recurring events (RRULE) are not supported and will be skipped",
  noDtstart: "DTSTART is missing",
  convertError: "Conversion error: {reason}",
  locationLabel: "Location: {location}",

  loginUserFetchFail: "Failed to retrieve login user info",
  unknownError: "Unknown error",

  rootNotFound: "[iCaroon] #icaroon-root not found",
};
