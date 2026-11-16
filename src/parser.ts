import ICAL from "ical.js";
import { t } from "./i18n";
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
        subject: t("wholeFile"),
        reason: t("parseFailure", { reason: formatError(err) }),
      },
    ];
  }

  const root = new ICAL.Component(jcal as never);
  const vevents = root.getAllSubcomponents("vevent");
  if (vevents.length === 0) {
    return [{ ok: false, subject: t("noVevent"), reason: t("noVeventReason") }];
  }

  return vevents.map(toParseResult);
}

function toParseResult(vevent: ICAL.Component): ParseResult {
  const event = new ICAL.Event(vevent);
  const subject = event.summary ?? t("untitled");

  try {
    if (event.isRecurring()) {
      return { ok: false, subject, reason: t("rruleUnsupported") };
    }

    const startTime = event.startDate;
    if (!startTime) {
      return { ok: false, subject, reason: t("noDtstart") };
    }

    const isAllDay = startTime.isDate === true;
    // ical.js は DTEND も DURATION も無いと終了を開始時刻で補うため、元のプロパティで判定する
    const hasEnd = vevent.hasProperty("dtend") || vevent.hasProperty("duration");
    const endTime = isAllDay || hasEnd ? (event.endDate ?? null) : null;

    const start = formatTime(startTime, isAllDay, tzidParam(vevent, "dtstart"));
    const end = endTime
      ? formatTime(
          endTime,
          isAllDay,
          // DURATION で終了が決まる場合は DTEND が無いので、DTSTART の TZID を使う
          tzidParam(vevent, "dtend") ?? tzidParam(vevent, "dtstart"),
        )
      : undefined;
    const isStartOnly = !end;

    const notesParts: string[] = [];
    if (event.description) notesParts.push(event.description);
    if (event.location) notesParts.push(t("locationLabel", { location: event.location }));
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
    return { ok: false, subject, reason: t("convertError", { reason: formatError(err) }) };
  }
}

function formatTime(
  time: ICAL.Time,
  isAllDay: boolean,
  tzid: string | undefined,
): { dateTime: string; timeZone: string } {
  if (isAllDay) {
    const y = pad4(time.year);
    const m = pad2(time.month);
    const d = pad2(time.day);
    return {
      dateTime: `${y}-${m}-${d}T00:00:00+09:00`,
      timeZone: DEFAULT_TZ,
    };
  }

  const local = `${pad4(time.year)}-${pad2(time.month)}-${pad2(time.day)}T${pad2(
    time.hour,
  )}:${pad2(time.minute)}:${pad2(time.second)}`;

  const zoneTzid = time.zone?.tzid;
  if (zoneTzid && zoneTzid !== "floating") {
    // VTIMEZONE か UTC で解決できたタイムゾーンは ical.js のオフセットを使う
    return {
      dateTime: `${local}${formatOffset(time.utcOffset())}`,
      timeZone: zoneTzid === "Z" ? "UTC" : zoneTzid,
    };
  }

  // floating time と、VTIMEZONE が無く解決できなかった TZID は、
  // TZID パラメータ（無いか不正なら DEFAULT_TZ）の IANA タイムゾーンとして扱う
  const timeZone = tzid && isValidTimeZone(tzid) ? tzid : DEFAULT_TZ;
  return {
    dateTime: `${local}${formatOffset(offsetInZone(time, timeZone))}`,
    timeZone,
  };
}

function tzidParam(vevent: ICAL.Component, name: string): string | undefined {
  const tzid = vevent.getFirstProperty(name)?.getParameter("tzid");
  return typeof tzid === "string" ? tzid : undefined;
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// 壁時計の時刻 time が、タイムゾーン timeZone で何秒のオフセットになるかを返す
function offsetInZone(time: ICAL.Time, timeZone: string): number {
  const wall = Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second);
  // 壁時計を UTC とみなした推定で一度オフセットを求め、その UTC 時刻で求め直す（DST の境界対策）
  const guess = zoneOffsetAt(wall, timeZone);
  return zoneOffsetAt(wall - guess * 1000, timeZone);
}

function zoneOffsetAt(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - utcMs) / 1000);
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
