# iCaroon

Garoon のポートレットとして動く `.ics` インポートツール。
他システム（Google Calendar / Outlook / Apple Calendar など）からエクスポートした iCalendar ファイルをアップロードし、Garoon REST API でログインユーザーの予定として一括登録する。

## 仕組み

- TypeScript + Vite (lib mode, IIFE) でビルドし、単一の JS / CSS バンドルを出力
- `scripts/build-xml.ts` がバンドルを Garoon の HTML ポートレット XML 形式 (`dist/iCaroon.xml`) にパッケージング
- 認証は Garoon JS API `garoon.api()` を経由（セッション認証・CSRF トークン管理は不要）
- `.ics` のパースは [ical.js](https://github.com/kewisch/ical.js) を使用

## 開発

開発環境のセットアップや、ローカル・実 Garoon 上での動作確認は [docs/development.md](docs/development.md) を参照。

## Garoon への導入

1. `pnpm build` で `dist/iCaroon.xml` を生成
2. Garoon のシステム管理 →「ポータル」→「HTMLポートレット」→「XMLファイルから読み込む」で `iCaroon.xml` を選択
3. ポータル（マイポータル可）に iCaroon ポートレットを配置
4. ポートレットの「ファイルを選択」から `.ics` をアップロード → プレビュー → 登録

## スコープ

MVP では以下のみ対応:

- 単発予定（時刻指定）
- 終日予定 (`DTSTART;VALUE=DATE`)
- 終了時刻なしの予定 (`isStartOnly`)
- 参加者はログインユーザーのみ

未対応（スキップしてサマリーに表示）:

- 繰り返し予定 (`RRULE`)
- `ATTENDEE` から Garoon ユーザーへのマッピング
- 施設 (`facilities`) の指定

## ライセンス

MIT License — Copyright (c) 2026 tasshi (Masaharu Tashiro)

詳細は [LICENSE](./LICENSE) を参照。

依存ライブラリ:
- [ical.js](https://github.com/kewisch/ical.js) (MPL 2.0)
