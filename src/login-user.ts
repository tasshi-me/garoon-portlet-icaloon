export async function getLoginUserCode(): Promise<string> {
  const user = await garoon.base.user.getLoginUser();
  if (!user?.code) {
    throw new Error("ログインユーザー情報が取得できませんでした");
  }
  return user.code;
}
