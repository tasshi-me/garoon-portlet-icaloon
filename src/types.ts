export type ParsedEvent = {
  subject: string;
  notes: string;
  isAllDay: boolean;
  isStartOnly: boolean;
  start: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
};

export type ParseResult =
  | { ok: true; event: ParsedEvent }
  | { ok: false; subject: string; reason: string };

export type GaroonEventInput = {
  eventType: "REGULAR" | "ALL_DAY";
  subject: string;
  notes?: string;
  isAllDay?: boolean;
  isStartOnly?: boolean;
  start: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
  attendees: Array<{ type: "USER"; code: string }>;
};

export type CreateResult =
  | { ok: true; subject: string }
  | { ok: false; subject: string; message: string };
