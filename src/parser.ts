import ICAL from "ical.js";
import type { ParseResult, ParsedEvent } from "./types";

const DEFAULT_TZ = "Asia/Tokyo";

export function parseIcs(text: string): ParseResult[] {
  let jcal: unknown;
  try {
    jcal = ICAL.parse(text);
  } catch (err) {
    return [
      {
        ok: false,
        subject: "(ファイル全体)",
        reason: `ics のパースに失敗: ${formatError(err)}`,
      },
    ];
  }

  const root = new ICAL.Component(jcal as never);
  const vevents = root.getAllSubcomponents("vevent");
  if (vevents.length === 0) {
    return [{ ok: false, subject: "(VEVENT なし)", reason: "VEVENT が含まれていません" }];
  }

  return vevents.map(toParseResult);
}

function toParseResult(vevent: ICAL.Component): ParseResult {
  const event = new ICAL.Event(vevent);
  const subject = event.summary ?? "(無題)";

  try {
    if (event.isRecurring()) {
      return { ok: false, subject, reason: "繰り返し予定 (RRULE) は未対応のためスキップ" };
    }

    const startTime = event.startDate;
    if (!startTime) {
      return { ok: false, subject, reason: "DTSTART がありません" };
    }

    const endTime = event.endDate ?? null;
    const isAllDay = startTime.isDate === true;

    const start = formatTime(startTime, isAllDay);
    const end = endTime ? formatTime(endTime, isAllDay) : undefined;
    const isStartOnly = !end;

    const notesParts: string[] = [];
    if (event.description) notesParts.push(event.description);
    if (event.location) notesParts.push(`場所: ${event.location}`);
    const notes = notesParts.join("\n");

    const parsed: ParsedEvent = {
      subject,
      notes,
      isAllDay,
      isStartOnly,
      start,
      end,
    };
    return { ok: true, event: parsed };
  } catch (err) {
    return { ok: false, subject, reason: `変換エラー: ${formatError(err)}` };
  }
}

function formatTime(time: ICAL.Time, isAllDay: boolean): { dateTime: string; timeZone: string } {
  if (isAllDay) {
    const y = pad4(time.year);
    const m = pad2(time.month);
    const d = pad2(time.day);
    return {
      dateTime: `${y}-${m}-${d}T00:00:00+09:00`,
      timeZone: DEFAULT_TZ,
    };
  }

  const tzid = resolveTzid(time);
  const offsetSec = time.utcOffset();
  const offsetStr = formatOffset(offsetSec);
  const local = `${pad4(time.year)}-${pad2(time.month)}-${pad2(time.day)}T${pad2(
    time.hour,
  )}:${pad2(time.minute)}:${pad2(time.second)}`;
  return {
    dateTime: `${local}${offsetStr}`,
    timeZone: tzid,
  };
}

function resolveTzid(time: ICAL.Time): string {
  const tzid = time.zone?.tzid;
  if (!tzid || tzid === "floating") return DEFAULT_TZ;
  if (tzid === "Z") return "UTC";
  return tzid;
}

function formatOffset(seconds: number): string {
  if (seconds === 0) return "Z";
  const sign = seconds >= 0 ? "+" : "-";
  const abs = Math.abs(seconds);
  const hh = pad2(Math.floor(abs / 3600));
  const mm = pad2(Math.floor((abs % 3600) / 60));
  return `${sign}${hh}:${mm}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function pad4(n: number): string {
  return n.toString().padStart(4, "0");
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
