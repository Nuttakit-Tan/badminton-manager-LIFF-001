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
    return;
  }

  loadMembers();
});

async function loadMembers() {
  const res = await apiCall("getUsers");

  const container = document.getElementById("memberList");
  container.innerHTML = "";

  res.users.forEach(user => {
    container.innerHTML += `
      <div class="member-card">
        <h3>${user.nickName}</h3>
        <p>ชื่อจริง: ${user.realName}</p>
        <p>ระดับ: ${user.level}</p>
        <p>คะแนน: ${user.point}</p>
      </div>
    `;
  });
}