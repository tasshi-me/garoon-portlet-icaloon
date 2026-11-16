// 開発時だけ使う `garoon` グローバルの代替。本番ビルドには含まれない
//   - mock: ダミーのログインユーザーを返し、API 呼び出しは成功扱いにする
//   - proxy: Vite dev サーバー経由で実 Garoon の REST API を呼ぶ（vite.config.ts の proxy）
const mode = import.meta.env.VITE_API_MODE === "proxy" ? "proxy" : "mock";

const mockGaroon: GaroonGlobal = {
  async api(path, method, params) {
    console.info(`[icaloon mock] ${method} ${path}`, params);
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {};
  },
  base: {
    user: {
      async getLoginUser() {
        return { id: "1", code: "mock-user", name: "Mock User" };
      },
    },
  },
};

const proxyGaroon: GaroonGlobal = {
  async api(path, method, params) {
    const isGet = method.toUpperCase() === "GET";
    const query =
      isGet && params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
    const res = await fetch(`/g${path}${query}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: isGet || params === undefined ? undefined : JSON.stringify(params),
    });
    const body: unknown = await res.json().catch(() => undefined);
    // 本物の garoon.api と同じく、エラー時はレスポンスボディで reject する
    if (!res.ok) throw body ?? new Error(`${res.status} ${res.statusText}`);
    return body;
  },
  base: {
    user: {
      async getLoginUser() {
        // Garoon のユーザーコードはログイン名と同じなので、.env.local の値を使う
        const code = __DEV_LOGIN_USER_CODE__;
        return { id: "", code, name: code };
      },
    },
  },
};

export function installGaroonShim(): void {
  window.garoon = mode === "proxy" ? proxyGaroon : mockGaroon;
  console.info(`[icaloon] garoon shim installed (mode: ${mode})`);
}
