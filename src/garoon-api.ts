import type { CreateResult, GaroonEventInput, ParsedEvent } from "./types";

export function buildEventInput(parsed: ParsedEvent, loginUserCode: string): GaroonEventInput {
  const base: GaroonEventInput = {
    eventType: parsed.isAllDay ? "ALL_DAY" : "REGULAR",
    subject: parsed.subject,
    start: parsed.start,
    attendees: [{ type: "USER", code: loginUserCode }],
  };
  if (parsed.notes) base.notes = parsed.notes;
  if (parsed.isAllDay) base.isAllDay = true;
  if (parsed.end) {
    base.end = parsed.end;
  } else {
    base.isStartOnly = true;
  }
  return base;
}

export async function createEvent(input: GaroonEventInput): Promise<CreateResult> {
  try {
    await garoon.api("/api/v1/schedule/events", "POST", input);
    return { ok: true, subject: input.subject };
  } catch (err) {
    return { ok: false, subject: input.subject, message: extractErrorMessage(err) };
  }
}

function extractErrorMessage(err: unknown): string {
  if (!err) return "不明なエラー";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const anyErr = err as { message?: string; errors?: unknown };
    if (typeof anyErr.message === "string") return anyErr.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
