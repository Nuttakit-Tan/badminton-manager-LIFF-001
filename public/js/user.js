document.addEventListener("DOMContentLoaded", async () => {
  const profile = await initLiff();

  if (!profile) return;

  document.getElementById("username").innerText =
    "สวัสดี " + profile.displayName;
});