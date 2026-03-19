function toggleLimitInput() {
  const type = document.getElementById("limitType").value;
  document.getElementById("limitInputBox").style.display =
    type === "limited" ? "block" : "none";
}

async function loadSessionProducts() {
  const select = document.getElementById("sessionShuttle");

  const res = await apiCall("getShuttleProducts");

  select.innerHTML = `<option value="">-- เลือกลูกแบด --</option>`;

  if (!res.products) return;

  res.products.forEach((p) => {
    select.innerHTML += `
      <option value="${p.productId}">
        ${p.brand} ${p.model}
      </option>
    `;
  });
}

async function createSession() {
  if (requestLock) return;
  requestLock = true;

  const btn = document.querySelector("#pageContent .btn-primary");
  btn.innerText = "กำลังสร้าง...";
  btn.disabled = true;

  const data = {
    action: "createSession",
    name: document.getElementById("sessionName").value,
    date: document.getElementById("sessionDate").value,
    startTime: document.getElementById("sessionTime").value,
    shuttleId: document.getElementById("sessionShuttle").value,
    courtCount: document.getElementById("courtCount").value,
    limitType: document.getElementById("limitType").value,
    maxPlayer: document.getElementById("maxPlayer").value,
    entryFee: document.getElementById("entryFee").value,
    createdBy: currentUser.userId,
  };
  if (!data.name || !data.date || !data.startTime) {
    alert("กรอกข้อมูลให้ครบ");
    btn.innerText = "สร้างก๊วน";
    btn.disabled = false;
    requestLock = false;
    return;
  }

  if (data.limitType === "limited" && Number(data.maxPlayer) <= 0) {
    alert("จำนวนต้องมากกว่า 0");
    btn.innerText = "สร้างก๊วน";
    btn.disabled = false;
    requestLock = false;
    return;
  }

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (result.success) {
    currentSessionId = result.sessionId; // ต้องให้ backend ส่งกลับมา

    showToast("สร้างก๊วนสำเร็จ");

    renderWaitingRoom(); // 👈 เพิ่มตรงนี้
  } else {
    alert("เกิดข้อผิดพลาด");
  }

  btn.innerText = "สร้างก๊วน";
  btn.disabled = false;
  requestLock = false;
}

async function joinCurrentSession() {
  if (!currentSessionId) {
    alert("ยังไม่มีก๊วนเปิดอยู่");
    return;
  }

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "joinSession",
      sessionId: currentSessionId,
      userId: currentUser.userId,
      isAdmin: false,
    }),
  });

  const result = await res.json();

  if (result.success) {
    showToast("เข้าร่วมสำเร็จ");
  } else {
    alert(result.message);
  }
}

async function closeCurrentSession() {
  if (!currentSessionId) {
    alert("ยังไม่มีก๊วน");
    return;
  }

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "closeSession",
      sessionId: currentSessionId,
    }),
  });

  const result = await res.json();

  if (result.success) {
    showToast("ปิดก๊วนเรียบร้อย");
  } else {
    alert("ปิดก๊วนไม่สำเร็จ");
  }
}

async function loadCurrentSession() {
  const res = await apiCall("getLatestSession");

  if (res.session) {
    currentSessionId = res.session.sessionId;
  } else {
    currentSessionId = null;
  }
}

function renderWaitingRoom() {
  const pageContent = document.getElementById("pageContent");

  pageContent.innerHTML = `
    <div class="member-page">

      <div class="page-header header-flex">
        <div>
          <h2>รอสมาชิกเข้าร่วม</h2>
          <div id="playerCountInfo" style="margin-top:5px; font-weight:600;"></div>
        </div>

        <div style="display:flex; gap:10px;">
        <button onclick="editSession()" class="btn-outline-sm">
  แก้ไขก๊วน
</button>
          <button onclick="openAddParticipantModal()" class="btn-primary-sm">
            + เพิ่มสมาชิก
          </button>
          <button onclick="startSession()" class="btn-primary-sm">
            เริ่มเล่น
          </button>
          <button onclick="cancelSession()" class="btn-danger-sm">
            ยกเลิกก๊วน
          </button>
        </div>
      </div>

      <div id="participantTable" style="margin-top:20px;"></div>

    </div>
  `;

  loadParticipants();
  updateSessionInfo();
}

async function startSession() {
  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "startSession",
      sessionId: currentSessionId,
    }),
  });

  renderPlayingRoom();
}

async function cancelSession() {
  if (!confirm("ยืนยันการยกเลิกก๊วนนี้?")) {
    return;
  }

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "cancelSession",
      sessionId: currentSessionId,
    }),
  });

  showToast("ยกเลิกก๊วนแล้ว");

  currentSessionId = null;
  cachedParticipants = null;
  loadPage("session");
}

async function updateSessionInfo() {
  const res = await apiCall("getLatestSession");

  if (!res.session) return;

  currentMaxPlayer = res.session.maxPlayer;
  currentCount = res.session.currentCount;

  const el = document.getElementById("playerCountInfo");

  if (currentMaxPlayer) {
    el.innerHTML = `จำนวนสมาชิก: ${currentCount} / ${currentMaxPlayer}`;
  } else {
    el.innerHTML = `จำนวนสมาชิก: ${currentCount}`;
  }
}

async function editSession() {
  const pageContent = document.getElementById("pageContent");

  // ✅ แสดง loading ก่อน
  pageContent.innerHTML = `
    <div style="display:flex; justify-content:center; padding:40px;">
      <div class="dot-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  const res = await apiCall("getLatestSession");
  if (!res.session) return;

  const s = res.session;

  // ✅ แล้วค่อย render form
  pageContent.innerHTML = `
    <div class="member-page edit-mode">
      <div class="page-header">
        <h2>แก้ไขรายละเอียดก๊วน</h2>
      </div>

      <div class="card" style="max-width:600px; margin-top:20px;">

        <label>ชื่อก๊วน</label>
        <input id="editSessionName" value="${s.name || ""}">

        <label>วันที่</label>
        <input id="editSessionDate" type="date" value="${s.date || ""}">

        <label>เวลาเริ่ม</label>
        <input id="editSessionTime" type="time" value="${s.startTime || ""}">

        <label>ลูกที่ใช้</label>
        <select id="editSessionShuttle"></select>

        <label>รูปแบบรับผู้เล่น</label>
        <select id="editLimitType" onchange="toggleEditLimit()">
          <option value="unlimited">ไม่จำกัด</option>
          <option value="limited">จำกัดจำนวน</option>
        </select>

        <div id="editLimitBox">
          <label>จำนวนสูงสุด</label>
          <input id="editMaxPlayer" type="number" min="1">
        </div>

        <label>ค่าสนามต่อคน</label>
        <input id="editEntryFee" type="number" value="${s.entryFee || 0}">

        <div style="margin-top:20px;">
          <button onclick="saveSessionEdit()" class="btn-primary" id="saveEditBtn">
            บันทึกการแก้ไข
          </button>
        </div>

      </div>
    </div>
  `;

  await loadSessionProductsForEdit(s);

  // sync maxPlayer
  if (s.maxPlayer && Number(s.maxPlayer) > 0) {
    document.getElementById("editLimitType").value = "limited";
    document.getElementById("editMaxPlayer").value = s.maxPlayer;
    document.getElementById("editLimitBox").style.display = "block";
  } else {
    document.getElementById("editLimitType").value = "unlimited";
    document.getElementById("editLimitBox").style.display = "none";
  }
}

async function loadSessionProductsForEdit(session) {
  const res = await apiCall("getShuttleProducts");
  const select = document.getElementById("editSessionShuttle");

  select.innerHTML = `<option value="">-- เลือกลูกแบด --</option>`;

  res.products.forEach((p) => {
    select.innerHTML += `
      <option value="${p.productId}">
        ${p.brand} ${p.model}
      </option>
    `;
  });

  select.value = session.shuttleId || "";

  if (session.maxPlayer) {
    document.getElementById("editLimitType").value = "limited";
    document.getElementById("editLimitBox").style.display = "block";
    document.getElementById("editMaxPlayer").value = session.maxPlayer;
  }

  document.getElementById("editEntryFee").value = session.entryFee || 0;
}

async function saveSessionEdit() {
  const btn = document.getElementById("saveEditBtn");

  if (btn.disabled) return;

  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  const limitType = document.getElementById("editLimitType").value;
  const newMax = Number(document.getElementById("editMaxPlayer").value);

  if (limitType === "limited" && newMax < currentCount) {
    alert(
      `มีสมาชิกเข้าร่วมแล้ว ${currentCount} คน\n` +
        `คุณไม่สามารถตั้งต่ำกว่านี้ได้`,
    );

    btn.innerText = "บันทึกการแก้ไข";
    btn.disabled = false;
    return;
  }

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateSession",
      sessionId: currentSessionId,
      name: document.getElementById("editSessionName").value,
      date: document.getElementById("editSessionDate").value,
      startTime: document.getElementById("editSessionTime").value,
      shuttleId: document.getElementById("editSessionShuttle").value,
      entryFee: document.getElementById("editEntryFee").value,
      limitType: limitType,
      maxPlayer: limitType === "limited" ? newMax : "",
    }),
  });

  showToast("แก้ไขสำเร็จ");

  renderWaitingRoom();

  btn.innerText = "บันทึกการแก้ไข";
  btn.disabled = false;
}

async function openSessionPage(el) {
  document
    .querySelectorAll(".menu li")
    .forEach((li) => li.classList.remove("active"));

  if (el) el.classList.add("active");

  const pageContent = document.getElementById("pageContent");

  pageContent.innerHTML = `
    <div style="display:flex; justify-content:center; padding:40px;">
      <div class="dot-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  const res = await apiCall("getLatestSession");

  if (!res || !res.session) {
    currentSessionId = null;
    renderSessionCreatePage(); // 👈 ตรงนี้สำคัญ
    return;
  }

  currentSessionId = res.session.sessionId;

  if (res.session.status === "open") {
    renderWaitingRoom();
  } else if (res.session.status === "playing") {
    renderPlayingRoom();
  } else {
    renderSessionCreatePage(); // 👈 ตรงนี้ด้วย
  }
}

function renderPlayingRoom() {
  const pageContent = document.getElementById("pageContent");

  pageContent.innerHTML = `
    <div class="member-page">
      <div class="page-header">
        <h2>กำลังเล่น</h2>
      </div>
      <div class="card">
        <p>ระบบกำลังเล่นอยู่...</p>
      </div>
    </div>
  `;
}

function renderSessionCreatePage() {
  const pageContent = document.getElementById("pageContent");

  pageContent.innerHTML = `
    <div class="member-page">

      <div class="page-header">
        <h2>จัดตั้งก๊วน</h2>
        <p class="page-sub">สร้างรอบเล่นแบด</p>
      </div>

      <div class="card" style="max-width:600px; margin-top:20px;">

        <label>ชื่อก๊วน</label>
        <input id="sessionName">

        <label>วันที่</label>
        <input id="sessionDate" type="date">

        <label>เวลาเริ่ม</label>
        <input id="sessionTime" type="time">

        <label>ลูกที่ใช้ (ค่าเริ่มต้น)</label>
        <select id="sessionShuttle"></select>

        <label>จำนวนสนาม</label>
        <input id="courtCount" type="number" min="1" value="1">

        <label>รูปแบบรับผู้เล่น</label>
        <select id="limitType" onchange="toggleLimitInput()">
          <option value="unlimited">ไม่จำกัด</option>
          <option value="limited">จำกัดจำนวน</option>
        </select>

        <div id="limitInputBox" style="display:none;">
          <label>จำนวนสูงสุด</label>
          <input id="maxPlayer" type="number" min="1">
        </div>

        <label>ค่าสนามต่อคน (บาท)</label>
        <input id="entryFee" type="number" min="0" value="0">

        <button onclick="createSession()" class="btn-primary">
          สร้างก๊วน
        </button>

        <div style="margin-top:15px;">
          <button onclick="closeCurrentSession()" class="btn-danger-sm">
            ปิดก๊วน
          </button>
        </div>

      </div>
    </div>
  `;

  loadSessionProducts();
}

document.addEventListener("DOMContentLoaded", async () => {
  const res = await apiCall("getUsers");
  cachedUsers = res.users || [];
});

function toggleEditLimit() {
  const type = document.getElementById("editLimitType").value;
  const box = document.getElementById("editLimitBox");

  box.style.display = type === "limited" ? "block" : "none";
}
