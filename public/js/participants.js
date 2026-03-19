async function loadParticipants() {
  const container = document.getElementById("participantTable");

  // ✅ ถ้ามี cache แล้ว ไม่ต้องยิง API ใหม่
  if (cachedParticipants) {
    renderParticipantsTable(cachedParticipants);
    return;
  }

  // 🔵 loading
  container.innerHTML = `
    <div style="display:flex; justify-content:center; padding:30px;">
      <div class="dot-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  const res = await apiCall("getParticipants", {
    sessionId: currentSessionId,
  });

  cachedParticipants = res.participants || [];

  renderParticipantsTable(cachedParticipants);
}

async function addParticipantManual() {
  const userId = prompt("ใส่ userId ที่ต้องการเพิ่ม");

  if (!userId) return;

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "joinSession",
      sessionId: currentSessionId,
      userId: userId,
      isAdmin: true,
    }),
  });

  const result = await res.json();

  if (result.success) {
    loadParticipants();
  } else {
    alert(result.message);
  }
}

async function openAddParticipantModal() {
  // 🔥 เปิด modal ก่อนทันที
  document.getElementById("participantModal").style.display = "flex";

  const list = document.getElementById("participantSelectList");

  // 🔵 แสดง loading ก่อน
  list.innerHTML = `
    <div style="display:flex; justify-content:center; padding:20px;">
      <div class="dot-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  // 🔥 ค่อยโหลดข้อมูลแบบ background
  loadParticipantData();
}

async function loadParticipantData() {
  await updateSessionInfo();

  if (!cachedUsers) {
    const userRes = await apiCall("getUsers");
    cachedUsers = userRes.users || [];
  }

  let participantRes;

  if (cachedParticipants) {
    participantRes = { participants: cachedParticipants };
  } else {
    const res = await apiCall("getParticipants", {
      sessionId: currentSessionId,
    });
    cachedParticipants = res.participants || [];
    participantRes = res;
  }

  const joinedIds = participantRes.participants.map((p) => p.userId);

  participantUsers = cachedUsers.filter((u) => !joinedIds.includes(u.userId));

  participantPage = 1;

  renderParticipantPage();
}

function renderParticipantPage() {
  const list = document.getElementById("participantSelectList");
  const pagination = document.getElementById("participantPagination");

  const start = (participantPage - 1) * participantPerPage;
  const end = start + participantPerPage;

  const pageUsers = participantUsers.slice(start, end);

  let html = "";

  pageUsers.forEach((u) => {
    html += `
    <div class="select-row">
      <div class="select-info">
        <div class="select-name">${u.nickName}</div>
        <div class="select-level">${u.level}</div>
      </div>
      <div>
        <input type="checkbox" value="${u.userId}">
      </div>
    </div>
  `;
  });

  list.innerHTML = html;

  // Pagination
  const totalPages = Math.ceil(participantUsers.length / participantPerPage);

  let pHtml = "";

  for (let i = 1; i <= totalPages; i++) {
    pHtml += `
      <button class="page-btn ${i === participantPage ? "active" : ""}"
        onclick="changeParticipantPage(${i})">
        ${i}
      </button>
    `;
  }

  pagination.innerHTML = pHtml;
}

function changeParticipantPage(page) {
  participantPage = page;
  renderParticipantPage();
}

function closeParticipantModal() {
  document.getElementById("participantModal").style.display = "none";
}

async function saveSelectedParticipants() {
  const btn = document.getElementById("saveParticipantBtn");

  if (btn.disabled) return; // 🔥 กันกดซ้ำ

  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  const checked = document.querySelectorAll(
    '#participantSelectList input[type="checkbox"]:checked',
  );

  if (checked.length === 0) {
    alert("กรุณาเลือกสมาชิก");
    btn.innerText = "บันทึก";
    btn.disabled = false;
    return;
  }

  const userIds = [];

  checked.forEach((cb) => {
    userIds.push(cb.value);
  });

  const totalAfterAdd = currentCount + userIds.length;

  if (currentMaxPlayer && totalAfterAdd > currentMaxPlayer) {
    alert(`จำนวนเกิน ${currentMaxPlayer} คน`);
    btn.innerText = "บันทึก";
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addMultipleParticipants",
        sessionId: currentSessionId,
        userIds: userIds,
      }),
    });

    const result = await res.json();

    if (!result.success) {
      alert(result.message);
      btn.innerText = "บันทึก";
      btn.disabled = false;
      return;
    }

    // 🔥 ล้าง cache เพื่อ reload ใหม่
    cachedParticipants = null;

    closeParticipantModal();

    await loadParticipants();
    await updateSessionInfo();
  } catch (err) {
    alert("เกิดข้อผิดพลาด");
  }

  btn.innerText = "บันทึก";
  btn.disabled = false;
}

function searchParticipant(keyword) {
  keyword = keyword.toLowerCase();

  const filtered = participantUsers.filter(
    (u) =>
      (u.nickName || "").toLowerCase().includes(keyword) ||
      (u.realName || "").toLowerCase().includes(keyword),
  );

  const list = document.getElementById("participantSelectList");

  let html = "";

  filtered.slice(0, participantPerPage).forEach((u) => {
    html += `
      <div style="margin-bottom:8px;">
        <label>
          <input type="checkbox" value="${u.userId}">
          ${u.nickName} (${u.level})
        </label>
      </div>
    `;
  });

  list.innerHTML = html;
}

async function removeParticipant(userId) {
  if (!confirm("ลบสมาชิกออกจากก๊วน?")) return;

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "removeParticipant",
      sessionId: currentSessionId,
      userId: userId,
    }),
  });

  cachedParticipants = null; // ✅ เพิ่ม

  await loadParticipants();
  await updateSessionInfo();
}

function renderParticipantsTable(participants) {
  const container = document.getElementById("participantTable");

  let html = `
    <table class="waiting-table">
      <thead>
        <tr>
          <th class="col-name">ชื่อ</th>
          <th class="col-status">สถานะ</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!participants || participants.length === 0) {
    html += `
      <tr>
        <td colspan="2" class="empty-row">
          ยังไม่มีผู้เข้าร่วม
        </td>
      </tr>
    `;
  } else {
    participants.forEach((p) => {
      html += `
        <tr>
          <td class="col-name">${p.nickName}</td>
          <td class="col-status">
            <div class="status-wrapper">
              <span class="status-badge">${p.status}</span>
              <button class="btn-remove"
                      onclick="removeParticipant('${p.userId}')">
                ลบ
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
