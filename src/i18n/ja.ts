import type { Messages } from "./messages";

export const ja: Messages = {
  appName: "iCal読め太郎 for Garoon",
  appTitle: "iCal読め太郎 for Garoon — ics インポート",

  fileDropHint: ".ics ファイルを選択またはドラッグ&ドロップしてください。",
  fileDropArea: "クリックして選択 / ここにドラッグ",

  parsedSummary: "{fileName}: {total} 件 (登録対象 {ok} 件 / スキップ {skip} 件)",
  registerButton: "{count} 件を登録",
  cancel: "キャンセル",

  registering: "登録中… {done} / {total}",

  doneSummary:
    "完了: 成功 {success} 件 / 失敗 {failed} 件 / 除外 {excluded} 件 / スキップ {skipped} 件",
  failedItem: "[失敗] {subject}: {message}",
  skippedItem: "[スキップ] {subject}: {reason}",
  tryAgain: "もう一度",

  colSelect: "すべて選択",
  selectEvent: "「{subject}」を登録する",
  colSubject: "件名",
  colStart: "開始",
  colEnd: "終了",
  colAllDay: "終日",
  colStatus: "状態",
  statusOk: "OK",
  endNone: "(なし)",

  wholeFile: "(ファイル全体)",
  noVevent: "(VEVENT なし)",
  noVeventReason: "VEVENT が含まれていません",
  parseFailure: "ics のパースに失敗: {reason}",
  untitled: "(無題)",
  rruleUnsupported: "繰り返し予定 (RRULE) は未対応のためスキップ",
  noDtstart: "DTSTART がありません",
  convertError: "変換エラー: {reason}",
  locationLabel: "場所: {location}",

  loginUserFetchFail: "ログインユーザー情報が取得できませんでした",
  unknownError: "不明なエラー",

  helpButton: "ヘルプ",
  helpTitle: "iCal読め太郎 for Garoon について",
  close: "閉じる",
  helpLinks: "リンク",
  helpRepository: "リポジトリ (GitHub)",
  helpLicense: "ライセンス",
  helpAppLicense: "iCal読め太郎 for Garoon は MIT License で提供しています。",
  helpOssLicenses: "オープンソースライセンス",
  helpOssLicensesNote:
    "iCal読め太郎 for Garoon は以下のオープンソースソフトウェアを利用しています。",
  helpSource: "ソース",
  helpSourceOf: "{name} のソースコード",

  rootNotFound: "[iCaloon] #icaloon-root が見つかりません",
};
