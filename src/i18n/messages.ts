export type Messages = {
  appName: string;
  appTitle: string;

  // idle screen
  fileDropHint: string;
  fileDropArea: string;

  // parsed preview
  parsedSummary: string; // {fileName} {total} {ok} {skip}
  registerButton: string; // {count}
  cancel: string;

  // running
  registering: string; // {done} {total}

  // done summary
  doneSummary: string; // {success} {failed} {excluded} {skipped}
  failedItem: string; // {subject} {message}
  skippedItem: string; // {subject} {reason}
  tryAgain: string;

  // table
  colSelect: string; // header checkbox label (select all)
  selectEvent: string; // {subject}
  colSubject: string;
  colStart: string;
  colEnd: string;
  colAllDay: string;
  colStatus: string;
  statusOk: string;
  endNone: string;

  // parser errors / labels
  wholeFile: string;
  noVevent: string;
  noVeventReason: string;
  parseFailure: string; // {reason}
  untitled: string;
  rruleUnsupported: string;
  noDtstart: string;
  convertError: string; // {reason}
  locationLabel: string; // {location}

  // auth / api errors
  loginUserFetchFail: string;
  unknownError: string;

  // help dialog
  helpButton: string;
  helpTitle: string;
  close: string;
  helpLinks: string;
  helpRepository: string;
  helpLicense: string;
  helpAppLicense: string;
  helpOssLicenses: string;
  helpOssLicensesNote: string;
  helpSource: string;
  helpSourceOf: string; // {name}

  // dev / debug
  rootNotFound: string;
};
