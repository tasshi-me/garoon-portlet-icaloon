import { appLicenseText, licenses } from "virtual:licenses";
import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "./i18n";

const REPOSITORY_URL = "https://github.com/tasshi-me/icaroon";
const COPYRIGHT = "© 2026 tasshi (Masaharu Tashiro)";
const APP_LICENSE_KEY = "icaroon";

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openLicense, setOpenLicense] = useState<string>();

  // モーダルで開くと、Esc での close・フォーカスの閉じ込め・背景の暗幕をブラウザが行う
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const toggle = (key: string) => setOpenLicense((cur) => (cur === key ? undefined : key));

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: キーボードでは Esc で閉じられる
    <dialog
      ref={dialogRef}
      class="icaroon-help-dialog"
      aria-label={t("helpTitle")}
      onClose={onClose}
      onClick={(e) => {
        // パネルの外（::backdrop）をクリックすると、イベントの対象は dialog 自身になる
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div class="icaroon-help-panel">
        <div class="icaroon-help-header">
          <span class="icaroon-help-title">
            iCaroon <span class="icaroon-help-version">v{__APP_VERSION__}</span>
          </span>
          <button
            type="button"
            class="icaroon-help-close"
            aria-label={t("close")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <section class="icaroon-help-section">
          <h4 class="icaroon-help-heading">{t("helpLinks")}</h4>
          <ul class="icaroon-help-list">
            <li>
              <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                {t("helpRepository")}
              </a>
            </li>
          </ul>
        </section>

        <section class="icaroon-help-section">
          <h4 class="icaroon-help-heading">{t("helpLicense")}</h4>
          <p class="icaroon-help-text">{COPYRIGHT}</p>
          <ul class="icaroon-help-licenses">
            <LicenseItem
              label={t("helpAppLicense")}
              tag="MIT"
              text={appLicenseText}
              open={openLicense === APP_LICENSE_KEY}
              onToggle={() => toggle(APP_LICENSE_KEY)}
            />
          </ul>
        </section>

        <section class="icaroon-help-section">
          <h4 class="icaroon-help-heading">{t("helpOssLicenses")}</h4>
          <p class="icaroon-help-text">{t("helpOssLicensesNote")}</p>
          <ul class="icaroon-help-licenses">
            {licenses.map((lib) => {
              const key = `${lib.name}@${lib.version}`;
              return (
                <LicenseItem
                  key={key}
                  label={key}
                  tag={lib.license}
                  text={lib.licenseText}
                  sourceUrl={lib.sourceUrl}
                  open={openLicense === key}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </ul>
        </section>
      </div>
    </dialog>
  );
}

function LicenseItem({
  label,
  tag,
  text,
  sourceUrl,
  open,
  onToggle,
}: {
  label: string;
  tag: string;
  text: string;
  sourceUrl?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li class="icaroon-help-license">
      <div class="icaroon-help-license-row">
        <button
          type="button"
          class="icaroon-help-license-toggle"
          aria-expanded={open}
          disabled={!text}
          onClick={onToggle}
        >
          <span>{label}</span>
          <span class="icaroon-help-license-tag">{tag}</span>
        </button>
        {sourceUrl && (
          <a
            class="icaroon-help-license-source"
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t("helpSourceOf", { name: label })}
          >
            {t("helpSource")}
          </a>
        )}
      </div>
      {open && <pre class="icaroon-help-license-text">{text}</pre>}
    </li>
  );
}
