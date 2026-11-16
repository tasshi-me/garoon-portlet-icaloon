import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parseIcs } from "./parser";

const VTIMEZONE_TOKYO = [
  "BEGIN:VTIMEZONE",
  "TZID:Asia/Tokyo",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0900",
  "TZOFFSETTO:+0900",
  "TZNAME:JST",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function ics(vevents: string[][], extra: string[] = []): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...extra,
    ...vevents.flatMap((lines, i) => ["BEGIN:VEVENT", `UID:test-${i}`, ...lines, "END:VEVENT"]),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

describe("parseIcs", () => {
  test("TZID 付きの予定を VTIMEZONE のオフセットで変換する", () => {
    const results = parseIcs(
      ics(
        [
          [
            "SUMMARY:打ち合わせ",
            "DESCRIPTION:定例",
            "LOCATION:会議室A",
            "DTSTART;TZID=Asia/Tokyo:20260605T100000",
            "DTEND;TZID=Asia/Tokyo:20260605T110000",
          ],
        ],
        VTIMEZONE_TOKYO,
      ),
    );

    expect(results).toEqual([
      {
        ok: true,
        event: {
          subject: "打ち合わせ",
          notes: "定例\nLocation: 会議室A",
          isAllDay: false,
          isStartOnly: false,
          start: { dateTime: "2026-06-05T10:00:00+09:00", timeZone: "Asia/Tokyo" },
          end: { dateTime: "2026-06-05T11:00:00+09:00", timeZone: "Asia/Tokyo" },
        },
      },
    ]);
  });

  test("UTC の予定は timeZone を UTC にする", () => {
    const [result] = parseIcs(
      ics([["SUMMARY:utc", "DTSTART:20260605T010000Z", "DTEND:20260605T020000Z"]]),
    );

    expect(result).toMatchObject({
      ok: true,
      event: {
        start: { dateTime: "2026-06-05T01:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2026-06-05T02:00:00Z", timeZone: "UTC" },
      },
    });
  });

  test("終日予定は日付の 0 時 (+09:00) にする", () => {
    const [result] = parseIcs(
      ics([["SUMMARY:休業日", "DTSTART;VALUE=DATE:20260613", "DTEND;VALUE=DATE:20260614"]]),
    );

    expect(result).toMatchObject({
      ok: true,
      event: {
        isAllDay: true,
        start: { dateTime: "2026-06-13T00:00:00+09:00", timeZone: "Asia/Tokyo" },
        end: { dateTime: "2026-06-14T00:00:00+09:00", timeZone: "Asia/Tokyo" },
      },
    });
  });

  test("SUMMARY が無い予定は無題として扱う", () => {
    const [result] = parseIcs(ics([["DTSTART:20260605T010000Z", "DTEND:20260605T020000Z"]]));

    expect(result).toMatchObject({ ok: true, event: { subject: "(untitled)" } });
  });

  test("繰り返し予定 (RRULE) はスキップする", () => {
    const [result] = parseIcs(
      ics([
        [
          "SUMMARY:毎週",
          "DTSTART:20260608T000000Z",
          "DTEND:20260608T003000Z",
          "RRULE:FREQ=WEEKLY;COUNT=4",
        ],
      ]),
    );

    expect(result).toEqual({
      ok: false,
      subject: "毎週",
      reason: "Recurring events (RRULE) are not supported and will be skipped",
    });
  });

  test("VEVENT が無いファイルはエラーにする", () => {
    expect(parseIcs(ics([]))).toEqual([
      { ok: false, subject: "(no VEVENT)", reason: "No VEVENT found" },
    ]);
  });

  test("パースできないファイルはエラーにする", () => {
    const [result] = parseIcs("garbage");

    expect(result).toMatchObject({ ok: false, subject: "(entire file)" });
    expect(result?.ok === false && result.reason).toMatch(/^Failed to parse ics: /);
  });

  test("samples/sample.ics をパースできる", () => {
    const text = readFileSync(resolve(import.meta.dirname, "../samples/sample.ics"), "utf8");
    const results = parseIcs(text);

    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
  });

  describe("VTIMEZONE が無い時刻", () => {
    test("TZID=Asia/Tokyo の予定を +09:00 で変換する", () => {
      const [result] = parseIcs(
        ics([
          [
            "SUMMARY:vtimezone なし",
            "DTSTART;TZID=Asia/Tokyo:20260605T100000",
            "DTEND;TZID=Asia/Tokyo:20260605T110000",
          ],
        ]),
      );

      expect(result).toMatchObject({
        ok: true,
        event: {
          start: { dateTime: "2026-06-05T10:00:00+09:00", timeZone: "Asia/Tokyo" },
          end: { dateTime: "2026-06-05T11:00:00+09:00", timeZone: "Asia/Tokyo" },
        },
      });
    });

    test("TZID のタイムゾーンのサマータイムを考慮する", () => {
      const results = parseIcs(
        ics([
          ["SUMMARY:夏", "DTSTART;TZID=America/New_York:20260701T090000"],
          ["SUMMARY:冬", "DTSTART;TZID=America/New_York:20260105T090000"],
        ]),
      );

      expect(results).toMatchObject([
        {
          ok: true,
          event: { start: { dateTime: "2026-07-01T09:00:00-04:00", timeZone: "America/New_York" } },
        },
        {
          ok: true,
          event: { start: { dateTime: "2026-01-05T09:00:00-05:00", timeZone: "America/New_York" } },
        },
      ]);
    });

    test("不正な TZID は Asia/Tokyo とみなす", () => {
      const [result] = parseIcs(
        ics([["SUMMARY:不正", "DTSTART;TZID=Tokyo Standard Time:20260605T100000"]]),
      );

      expect(result).toMatchObject({
        ok: true,
        event: { start: { dateTime: "2026-06-05T10:00:00+09:00", timeZone: "Asia/Tokyo" } },
      });
    });

    test("floating time の予定を Asia/Tokyo (+09:00) で変換する", () => {
      const [result] = parseIcs(
        ics([["SUMMARY:floating", "DTSTART:20260605T100000", "DTEND:20260605T110000"]]),
      );

      expect(result).toMatchObject({
        ok: true,
        event: {
          start: { dateTime: "2026-06-05T10:00:00+09:00", timeZone: "Asia/Tokyo" },
          end: { dateTime: "2026-06-05T11:00:00+09:00", timeZone: "Asia/Tokyo" },
        },
      });
    });
  });

  describe("終了時刻", () => {
    test("DTEND が無い予定は isStartOnly にする", () => {
      const [result] = parseIcs(ics([["SUMMARY:終了なし", "DTSTART:20260607T050000Z"]]));

      expect(result).toMatchObject({ ok: true, event: { isStartOnly: true } });
      expect(result?.ok && result.event.end).toBeUndefined();
    });

    test("DURATION がある予定は DTSTART の TZID で終了時刻を出す", () => {
      const [result] = parseIcs(
        ics([["SUMMARY:duration", "DTSTART;TZID=Asia/Tokyo:20260605T100000", "DURATION:PT30M"]]),
      );

      expect(result).toMatchObject({
        ok: true,
        event: {
          isStartOnly: false,
          end: { dateTime: "2026-06-05T10:30:00+09:00", timeZone: "Asia/Tokyo" },
        },
      });
    });

    test("DTEND が無い終日予定は翌日までにする", () => {
      const [result] = parseIcs(ics([["SUMMARY:終日", "DTSTART;VALUE=DATE:20260613"]]));

      expect(result).toMatchObject({
        ok: true,
        event: {
          isAllDay: true,
          isStartOnly: false,
          end: { dateTime: "2026-06-14T00:00:00+09:00", timeZone: "Asia/Tokyo" },
        },
      });
    });
  });
});
