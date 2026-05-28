import { t } from "./i18n";

export async function getLoginUserCode(): Promise<string> {
  const user = await garoon.base.user.getLoginUser();
  if (!user?.code) {
    throw new Error(t("loginUserFetchFail"));
  }
  return user.code;
}
