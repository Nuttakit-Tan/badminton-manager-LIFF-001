async function initLiff() {
  await liff.init({ liffId: CONFIG.LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  const profile = await liff.getProfile();
  return profile;
}
