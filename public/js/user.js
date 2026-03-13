document.addEventListener("DOMContentLoaded", async () => {
  const profile = await initLiff();
  if (!profile) return;

  document.getElementById("username").innerText =
    "สวัสดี " + profile.displayName;

  const result = await apiCall("checkUser", {
    userId: profile.userId
  });

  if (!result.exists) {
    alert("ยังไม่เคยสมัคร");
  } else {
    alert("เคยสมัครแล้ว");
  }
});