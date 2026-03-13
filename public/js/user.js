document.addEventListener("DOMContentLoaded", async () => {
  const profile = await initLiff();
  if (!profile) return;

  document.getElementById("username").innerText =
    "สวัสดี " + profile.displayName;

  const result = await apiCall("checkUser", {
    userId: profile.userId
  });

  if (!result.exists) {
  showRegisterForm(profile);
  return;
}

  // โหลดหน้าแรก
  loadPage("members", document.querySelector(".menu li"));
});


// ================= ROUTER =================

function loadPage(page, el) {

  document.querySelectorAll(".menu li").forEach(li => {
    li.classList.remove("active");
  });

  if (el) el.classList.add("active");

  if (page === "members") loadMembersPage();
  if (page === "session") loadSessionPage();
  if (page === "shuttle") loadShuttlePage();
  if (page === "history") loadHistoryPage();
  if (page === "payment") loadPaymentPage();
}


// ================= MEMBERS PAGE =================

async function loadMembersPage() {

  const res = await apiCall("getUsers");

  let html = `<h2>รายชื่อสมาชิก</h2>`;

  res.users.forEach(user => {
    html += `
      <div class="member-card">
        <h3>${user.nickName}</h3>
        <p>ชื่อจริง: ${user.realName}</p>
        <p>ระดับ: ${user.level}</p>
        <p>คะแนน: ${user.point}</p>
      </div>
    `;
  });

  document.getElementById("pageContent").innerHTML = html;
}


// ================= OTHER PAGES =================

function loadSessionPage() {
  document.getElementById("pageContent").innerHTML = `
    <h2>หน้าจัดก๊วน</h2>
  `;
}

function loadShuttlePage() {
  document.getElementById("pageContent").innerHTML = `
    <h2>หน้าลูกแบด</h2>
  `;
}

function loadHistoryPage() {
  document.getElementById("pageContent").innerHTML = `
    <h2>หน้าประวัติ</h2>
  `;
}

function loadPaymentPage() {
  document.getElementById("pageContent").innerHTML = `
    <h2>หน้าชำระเงิน</h2>
  `;
}

function showRegisterForm(profile) {

  document.getElementById("pageContent").innerHTML = `
  
  <h2>สมัครสมาชิก</h2>

  <div class="card">

    <input id="nickName" placeholder="ชื่อเล่น">

    <input id="realName" placeholder="ชื่อจริง">

    <input id="phone" placeholder="เบอร์โทร">

    <input id="birthday" type="date">

    <select id="level">
      <option value="Beginner">Beginner</option>
      <option value="P">P</option>
      <option value="P+">P+</option>
      <option value="S">S</option>
    </select>

    <button onclick="registerUser()">สมัครสมาชิก</button>

  </div>
  `;
}
async function registerUser() {

  const profile = await liff.getProfile();

  const data = {
    action: "registerUser",
    userId: profile.userId,
    lineDisplayName: profile.displayName,
    linePictureUrl: profile.pictureUrl,
    nickName: document.getElementById("nickName").value,
    realName: document.getElementById("realName").value,
    phone: document.getElementById("phone").value,
    birthday: document.getElementById("birthday").value,
    level: document.getElementById("level").value
  };

  const query = new URLSearchParams(data).toString();

  await fetch(CONFIG.API_URL + "?" + query);

  alert("สมัครสำเร็จ");

  location.reload();
}