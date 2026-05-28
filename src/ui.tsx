import { useState } from "preact/hooks";
import { buildEventInput, createEvent } from "./garoon-api";
import { t } from "./i18n";
import { getLoginUserCode } from "./login-user";
import { parseIcs } from "./parser";
import type { CreateResult, ParseResult } from "./types";

type State =
  | { phase: "idle" }
  | { phase: "parsed"; fileName: string; results: ParseResult[] }
  | {
      phase: "running";
      fileName: string;
      results: ParseResult[];
      done: number;
      total: number;
      creates: CreateResult[];
    }
  | {
      phase: "done";
      fileName: string;
      results: ParseResult[];
      creates: CreateResult[];
    };

export function App() {
  const [state, setState] = useState<State>({ phase: "idle" });

  return (
    <div class="icaroon">
      <h3 class="icaroon-title">{t("appTitle")}</h3>
      {state.phase === "idle" && <IdleView onParsed={setState} />}
      {state.phase === "parsed" && <ParsedView state={state} setState={setState} />}
      {state.phase === "running" && <RunningView state={state} />}
      {state.phase === "done" && (
        <DoneView state={state} onReset={() => setState({ phase: "idle" })} />
      )}
    </div>
  );
}

function IdleView({ onParsed }: { onParsed: (s: State) => void }) {
  const [active, setActive] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    const results = parseIcs(text);
    onParsed({ phase: "parsed", fileName: file.name, results });
  }

  return (
    <>
      <p class="icaroon-subtitle">{t("fileDropHint")}</p>
      <label
        class={`icaroon-drop${active ? " icaroon-drop--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setActive(false);
          const file = e.dataTransfer?.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <input
          type="file"
          accept=".ics,text/calendar"
          onChange={(e) => {
            const file = (e.currentTarget as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div class="icaroon-drop-text">{t("fileDropArea")}</div>
      </label>
    </>
  );
}

function ParsedView({
  state,
  setState,
}: {
  state: Extract<State, { phase: "parsed" }>;
  setState: (s: State) => void;
}) {
  const okCount = state.results.filter((r) => r.ok).length;
  const skipCount = state.results.length - okCount;

  async function runImport() {
    const targets = state.results.flatMap((r) => (r.ok ? [r.event] : []));
    if (targets.length === 0) return;

    let loginUserCode: string;
    try {
      loginUserCode = await getLoginUserCode();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({
        phase: "done",
        fileName: state.fileName,
        results: state.results,
        creates: targets.map((target) => ({
          ok: false,
          subject: target.subject,
          message: msg,
        })),
      });
      return;
    }

    const creates: CreateResult[] = [];
    setState({
      phase: "running",
      fileName: state.fileName,
      results: state.results,
      done: 0,
      total: targets.length,
      creates,
    });

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target) continue;
      const result = await createEvent(buildEventInput(target, loginUserCode));
      creates.push(result);
      setState({
        phase: "running",
        fileName: state.fileName,
        results: state.results,
        done: i + 1,
        total: targets.length,
        creates: [...creates],
      });
    }

    setState({
      phase: "done",
      fileName: state.fileName,
      results: state.results,
      creates,
    });
  }

  return (
    <>
      <p class="icaroon-subtitle">
        {t("parsedSummary", {
          fileName: state.fileName,
          total: state.results.length,
          ok: okCount,
          skip: skipCount,
        })}
      </p>
      <ResultTable results={state.results} />
      <div class="icaroon-actions">
        <button
          type="button"
          class="icaroon-button icaroon-button--primary"
          disabled={okCount === 0}
          onClick={runImport}
        >
          {t("registerButton", { count: okCount })}
        </button>
        <button type="button" class="icaroon-button" onClick={() => setState({ phase: "idle" })}>
          {t("cancel")}
        </button>
      </div>
    </>
  );
}

function RunningView({ state }: { state: Extract<State, { phase: "running" }> }) {
  return (
    <>
      <p class="icaroon-subtitle">{t("registering", { done: state.done, total: state.total })}</p>
      <div class="icaroon-progress">
        <div
          class="icaroon-progress-bar"
          style={{ width: `${(state.done / state.total) * 100}%` }}
        />
      </div>
    </>
  );
}

function DoneView({
  state,
  onReset,
}: {
  state: Extract<State, { phase: "done" }>;
  onReset: () => void;
}) {
  const success = state.creates.filter((c) => c.ok).length;
  const failed = state.creates.filter((c) => !c.ok) as Array<{
    ok: false;
    subject: string;
    message: string;
  }>;
  const skipped = state.results.filter((r) => !r.ok) as Array<{
    ok: false;
    subject: string;
    reason: string;
  }>;
  const allGood = failed.length === 0 && skipped.length === 0;

  return (
    <>
      <div
        class={`icaroon-summary ${allGood ? "icaroon-summary--success" : "icaroon-summary--mixed"}`}
      >
        {t("doneSummary", {
          success,
          failed: failed.length,
          skipped: skipped.length,
        })}
      </div>
      {(failed.length > 0 || skipped.length > 0) && (
        <ul class="icaroon-error-list">
          {failed.map((f, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: list is immutable
            <li key={`f-${i}`}>{t("failedItem", { subject: f.subject, message: f.message })}</li>
          ))}
          {skipped.map((sk, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: list is immutable
            <li key={`s-${i}`}>{t("skippedItem", { subject: sk.subject, reason: sk.reason })}</li>
          ))}
        </ul>
      )}
      <div class="icaroon-actions">
        <button type="button" class="icaroon-button icaroon-button--primary" onClick={onReset}>
          {t("tryAgain")}
        </button>
      </div>
    </>
  );
}

function ResultTable({ results }: { results: ParseResult[] }) {
  return (
    <table class="icaroon-table">
      <thead>
        <tr>
          <th>{t("colSubject")}</th>
          <th>{t("colStart")}</th>
          <th>{t("colEnd")}</th>
          <th>{t("colAllDay")}</th>
          <th>{t("colStatus")}</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) =>
          r.ok ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: list is immutable
            <tr key={i}>
              <td>{r.event.subject}</td>
              <td>
                {formatDateTime(r.event.start.dateTime, r.event.start.timeZone, r.event.isAllDay)}
              </td>
              <td>
                {r.event.end
                  ? formatDateTime(r.event.end.dateTime, r.event.end.timeZone, r.event.isAllDay)
                  : t("endNone")}
              </td>
              <td>{r.event.isAllDay ? "✓" : ""}</td>
              <td>{t("statusOk")}</td>
            </tr>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: list is immutable
            <tr key={i} class="icaroon-row--skip">
              <td>{r.subject}</td>
              <td colspan={3} />
              <td>{r.reason}</td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}

function formatDateTime(iso: string, timeZone: string, isAllDay: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(isAllDay ? {} : { hour: "2-digit", minute: "2-digit", hour12: false }),
    timeZone,
  }).format(d);
}
