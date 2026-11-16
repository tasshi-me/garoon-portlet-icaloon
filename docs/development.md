# 開発者向けガイド

## セットアップ

[mise](https://mise.jdx.dev/) で Node.js / pnpm を管理している。

```sh
mise install
pnpm install
```

## 開発

```sh
pnpm dev          # dev サーバーを起動（既定は mock モード）
pnpm test         # ユニットテスト (Vitest)
pnpm typecheck    # 型チェック
pnpm lint         # Biome
pnpm build        # dist/ にポートレットの XML と HTML を生成
```

`http://localhost:5173/` を開くと、ポートレットを単体で確認できる。
`.ics` の動作確認には `samples/sample.ics` を使える。

ローカルには `garoon` グローバルが無いため、開発時は代替（`src/dev/garoon-shim.ts`）を差し込む。
API モードは 2 つある:

- **mock**（既定）: ダミーのログインユーザーを返し、予定登録は成功扱いにする。
  登録内容はブラウザのコンソールに出る。UI 開発はこれで完結する
- **proxy**: Vite dev サーバーが実 Garoon へプロキシする。実際に予定が登録されるので注意。
  テンプレートをコピーして認証情報を記入する:

  ```sh
  cp .env.local.template .env.local
  # GAROON_BASE_URL / GAROON_USERNAME / GAROON_PASSWORD を記入
  pnpm dev:proxy
  ```

  ログインユーザーのコードとして `GAROON_USERNAME` を使う。

代替は開発時だけ使われ、本番ビルドには含まれない。

### 実 Garoon 上で HMR 開発する（ビルド・再インポート不要）

開発用ポートレットを一度だけインポートすれば、以降はコード編集が HMR で
実 Garoon のポータルに即反映される。

1. `dev/html_portlet.dev.xml` を Garoon に一度だけインポートしてポータルに配置
   （中身は `#icaroon-root` と `http://localhost:5173` のスクリプトを読むだけ）
2. `pnpm dev` を起動
3. ブラウザでポータルを開く。以降はコードを編集すると自動で反映される

Garoon のページには本物の `garoon` グローバルがあるので、代替は使われず実 API を呼ぶ。

注意:

- Chrome は HTTPS ページからでも `localhost` の読み込みを例外的に許可する。
  他ブラウザや、Garoon の CSP で外部スクリプトが禁止されている場合は読み込めない
- dev サーバーはポート 5173 固定。使用中なら起動に失敗する

## ビルドとデプロイ

[deploy.md](deploy.md) を参照。
