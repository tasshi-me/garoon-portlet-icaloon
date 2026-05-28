declare global {
  interface GaroonLoginUser {
    id: string;
    code: string;
    name: string;
  }

  interface GaroonGlobal {
    api(path: string, method: string, params?: unknown): Promise<unknown>;
    base: {
      user: {
        getLoginUser(): Promise<GaroonLoginUser>;
      };
    };
  }

  var garoon: GaroonGlobal;

  interface Window {
    garoon: GaroonGlobal;
  }
}

export {};
