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

export function mount(root: HTMLElement): void {
  let state: State = { phase: "idle" };
  render();

  function setState(next: State) {
    state = next;
    render();
  }

  function render() {
    root.innerHTML = "";
    root.classList.add("icaroon");

    const title = document.createElement("h3");
    title.className = "icaroon-title";
    title.textContent = t("appTitle");
    root.appendChild(title);

    switch (state.phase) {
      case "idle":
        renderIdle();
        break;
      case "parsed":
        renderParsed(state);
        break;
      case "running":
        renderRunning(state);
        break;
      case "done":
        renderDone(state);
        break;
    }
  }

  function renderIdle() {
    const sub = document.createElement("p");
    sub.className = "icaroon-subtitle";
    sub.textContent = t("fileDropHint");
    root.appendChild(sub);

    const drop = document.createElement("label");
    drop.className = "icaroon-drop";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ics,text/calendar";

    const text = document.createElement("div");
    text.className = "icaroon-drop-text";
    text.textContent = t("fileDropArea");

    drop.appendChild(input);
    drop.appendChild(text);
    root.appendChild(drop);

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (file) await handleFile(file);
    });

    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("icaroon-drop--active");
    });
    drop.addEventListener("dragleave", () => {
      drop.classList.remove("icaroon-drop--active");
    });
    drop.addEventListener("drop", async (e) => {
      e.preventDefault();
      drop.classList.remove("icaroon-drop--active");
      const file = e.dataTransfer?.files?.[0];
      if (file) await handleFile(file);
    });
  }

  async function handleFile(file: File) {
    const text = await file.text();
    const results = parseIcs(text);
    setState({ phase: "parsed", fileName: file.name, results });
  }

  function renderParsed(s: Extract<State, { phase: "parsed" }>) {
    const sub = document.createElement("p");
    sub.className = "icaroon-subtitle";
    const okCount = s.results.filter((r) => r.ok).length;
    const skipCount = s.results.length - okCount;
    sub.textContent = t("parsedSummary", {
      fileName: s.fileName,
      total: s.results.length,
      ok: okCount,
      skip: skipCount,
    });
    root.appendChild(sub);

    root.appendChild(buildResultTable(s.results));

    const actions = document.createElement("div");
    actions.className = "icaroon-actions";

    const runBtn = document.createElement("button");
    runBtn.className = "icaroon-button icaroon-button--primary";
    runBtn.textContent = t("registerButton", { count: okCount });
    runBtn.disabled = okCount === 0;
    runBtn.addEventListener("click", () => runImport(s));
    actions.appendChild(runBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "icaroon-button";
    cancelBtn.textContent = t("cancel");
    cancelBtn.addEventListener("click", () => setState({ phase: "idle" }));
    actions.appendChild(cancelBtn);

    root.appendChild(actions);
  }

  async function runImport(s: Extract<State, { phase: "parsed" }>) {
    const targets = s.results.flatMap((r) => (r.ok ? [r.event] : []));
    if (targets.length === 0) return;

    let loginUserCode: string;
    try {
      loginUserCode = await getLoginUserCode();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const creates: CreateResult[] = targets.map((t) => ({
        ok: false,
        subject: t.subject,
        message: msg,
      }));
      setState({ phase: "done", fileName: s.fileName, results: s.results, creates });
      return;
    }

    const creates: CreateResult[] = [];
    setState({
      phase: "running",
      fileName: s.fileName,
      results: s.results,
      done: 0,
      total: targets.length,
      creates,
    });

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target) continue;
      const input = buildEventInput(target, loginUserCode);
      const result = await createEvent(input);
      creates.push(result);
      setState({
        phase: "running",
        fileName: s.fileName,
        results: s.results,
        done: i + 1,
        total: targets.length,
        creates: [...creates],
      });
    }

    setState({ phase: "done", fileName: s.fileName, results: s.results, creates });
  }

  function renderRunning(s: Extract<State, { phase: "running" }>) {
    const sub = document.createElement("p");
    sub.className = "icaroon-subtitle";
    sub.textContent = t("registering", { done: s.done, total: s.total });
    root.appendChild(sub);

    const bar = document.createElement("div");
    bar.className = "icaroon-progress";
    const inner = document.createElement("div");
    inner.className = "icaroon-progress-bar";
    inner.style.width = `${(s.done / s.total) * 100}%`;
    bar.appendChild(inner);
    root.appendChild(bar);
  }

  function renderDone(s: Extract<State, { phase: "done" }>) {
    const success = s.creates.filter((c) => c.ok).length;
    const failed = s.creates.filter((c) => !c.ok);
    const skipped = s.results.filter((r) => !r.ok);

    const summary = document.createElement("div");
    summary.className = "icaroon-summary";
    if (failed.length === 0 && skipped.length === 0) {
      summary.classList.add("icaroon-summary--success");
    } else {
      summary.classList.add("icaroon-summary--mixed");
    }
    summary.textContent = t("doneSummary", {
      success,
      failed: failed.length,
      skipped: skipped.length,
    });
    root.appendChild(summary);

    if (failed.length > 0 || skipped.length > 0) {
      const list = document.createElement("ul");
      list.className = "icaroon-error-list";
      for (const f of failed) {
        const li = document.createElement("li");
        li.textContent = t("failedItem", { subject: f.subject, message: f.message });
        list.appendChild(li);
      }
      for (const sk of skipped) {
        if (sk.ok) continue;
        const li = document.createElement("li");
        li.textContent = t("skippedItem", { subject: sk.subject, reason: sk.reason });
        list.appendChild(li);
      }
      root.appendChild(list);
    }

    const actions = document.createElement("div");
    actions.className = "icaroon-actions";
    const again = document.createElement("button");
    again.className = "icaroon-button icaroon-button--primary";
    again.textContent = t("tryAgain");
    again.addEventListener("click", () => setState({ phase: "idle" }));
    actions.appendChild(again);
    root.appendChild(actions);
  }

  function buildResultTable(results: ParseResult[]): HTMLElement {
    const table = document.createElement("table");
    table.className = "icaroon-table";
    const thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>${escapeHtml(t("colSubject"))}</th><th>${escapeHtml(
      t("colStart"),
    )}</th><th>${escapeHtml(t("colEnd"))}</th><th>${escapeHtml(
      t("colAllDay"),
    )}</th><th>${escapeHtml(t("colStatus"))}</th></tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const r of results) {
      const tr = document.createElement("tr");
      if (!r.ok) tr.classList.add("icaroon-row--skip");
      if (r.ok) {
        const e = r.event;
        const startStr = formatDateTime(e.start.dateTime, e.start.timeZone, e.isAllDay);
        const endStr = e.end
          ? formatDateTime(e.end.dateTime, e.end.timeZone, e.isAllDay)
          : t("endNone");
        tr.innerHTML = `<td>${escapeHtml(e.subject)}</td><td>${escapeHtml(
          startStr,
        )}</td><td>${escapeHtml(endStr)}</td><td>${
          e.isAllDay ? "✓" : ""
        }</td><td>${escapeHtml(t("statusOk"))}</td>`;
      } else {
        tr.innerHTML = `<td>${escapeHtml(r.subject)}</td><td colspan="3"></td><td>${escapeHtml(
          r.reason,
        )}</td>`;
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }
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

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
