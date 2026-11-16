import { useCallback, useState } from "preact/hooks";
import { buildEventInput, createEvent } from "./garoon-api";
import { HelpDialog } from "./help-dialog";
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
      excluded: number;
      creates: CreateResult[];
    }
  | {
      phase: "done";
      fileName: string;
      results: ParseResult[];
      excluded: number;
      creates: CreateResult[];
    };

export function App() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [helpOpen, setHelpOpen] = useState(false);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  return (
    <div class="icaroon" data-version={__APP_VERSION__}>
      <div class="icaroon-header">
        <h3 class="icaroon-title">{t("appTitle")}</h3>
        <button
          type="button"
          class="icaroon-help-button"
          aria-label={t("helpButton")}
          title={t("helpButton")}
          onClick={() => setHelpOpen(true)}
        >
          ?
        </button>
      </div>
      {state.phase === "idle" && <IdleView onParsed={setState} />}
      {state.phase === "parsed" && <ParsedView state={state} setState={setState} />}
      {state.phase === "running" && <RunningView state={state} />}
      {state.phase === "done" && (
        <DoneView state={state} onReset={() => setState({ phase: "idle" })} />
      )}
      {helpOpen && <HelpDialog onClose={closeHelp} />}
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
  // 登録できる予定は最初からすべて選択しておき、不要なものだけ外してもらう
  const [selected, setSelected] = useState<boolean[]>(() => state.results.map((r) => r.ok));
  const selectedCount = state.results.filter((r, i) => r.ok && selected[i]).length;
  const excluded = okCount - selectedCount;

  function toggle(index: number, checked: boolean) {
    setSelected((prev) => prev.map((v, i) => (i === index ? checked : v)));
  }

  function toggleAll(checked: boolean) {
    setSelected(state.results.map((r) => r.ok && checked));
  }

  async function runImport() {
    const targets = state.results.flatMap((r, i) => (r.ok && selected[i] ? [r.event] : []));
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
        excluded,
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
      excluded,
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
        excluded,
        creates: [...creates],
      });
    }

    setState({
      phase: "done",
      fileName: state.fileName,
      results: state.results,
      excluded,
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
      <ResultTable
        results={state.results}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />
      <div class="icaroon-actions">
        <button
          type="button"
          class="icaroon-button icaroon-button--primary"
          disabled={selectedCount === 0}
          onClick={runImport}
        >
          {t("registerButton", { count: selectedCount })}
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
  const allGood = failed.length === 0 && skipped.length === 0 && state.excluded === 0;

  return (
    <>
      <div
        class={`icaroon-summary ${allGood ? "icaroon-summary--success" : "icaroon-summary--mixed"}`}
      >
        {t("doneSummary", {
          success,
          failed: failed.length,
          excluded: state.excluded,
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

function ResultTable({
  results,
  selected,
  onToggle,
  onToggleAll,
}: {
  results: ParseResult[];
  selected: boolean[];
  onToggle: (index: number, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const selectable = results.filter((r) => r.ok).length;
  const selectedCount = results.filter((r, i) => r.ok && selected[i]).length;

  return (
    <table class="icaroon-table">
      <thead>
        <tr>
          <th class="icaroon-col-select">
            <input
              type="checkbox"
              aria-label={t("colSelect")}
              title={t("colSelect")}
              disabled={selectable === 0}
              checked={selectable > 0 && selectedCount === selectable}
              indeterminate={selectedCount > 0 && selectedCount < selectable}
              onChange={(e) => onToggleAll((e.currentTarget as HTMLInputElement).checked)}
            />
          </th>
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
            <tr key={i} class={selected[i] ? undefined : "icaroon-row--excluded"}>
              <td class="icaroon-col-select">
                <input
                  type="checkbox"
                  aria-label={t("selectEvent", { subject: r.event.subject })}
                  checked={selected[i] === true}
                  onChange={(e) => onToggle(i, (e.currentTarget as HTMLInputElement).checked)}
                />
              </td>
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
              <td class="icaroon-col-select">
                <input type="checkbox" aria-label={r.subject} checked={false} disabled />
              </td>
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
