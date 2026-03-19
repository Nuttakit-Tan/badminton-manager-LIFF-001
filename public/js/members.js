async function loadMembers() {
  const container = document.getElementById("memberList");

  container.innerHTML = `
    <div style="display:flex; justify-content:center; padding:40px;">
      <div class="dot-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  const res = await apiCall("getUsers");
  allUsers = res.users || []; // ✅ เก็บต้นฉบับที่นี่ที่เดียว

  renderMembers(allUsers);
}

function renderMembers(users) {
  const container = document.getElementById("memberList");
  const paginationContainer = document.getElementById("paginationTop");

  const total = users.length;
  const totalPages = Math.ceil(total / perPage);

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pageUsers = users.slice(start, end);

  // 🔥 render pagination แยกออกไป
  paginationContainer.innerHTML = renderPagination(totalPages);

  let html = "";

  pageUsers.forEach((u) => {
    const age = calculateAge(u.birthday);

    const avatar =
      u.isLineUser && u.linePictureUrl
        ? `<img src="${u.linePictureUrl}" class="avatar">`
        : `<div class="avatar placeholder">
            <span class="material-symbols-outlined">person</span>
          </div>`;

    html += `
      <div class="member-card">

        <div class="member-header">

          <div class="member-info">
            ${avatar}
            <div>
              <h3>${u.nickName || "-"}</h3>
              <p class="real-name">${u.realName || "-"}</p>
            </div>
          </div>

          <div class="member-actions">
            <span class="material-symbols-outlined edit" onclick="editUser('${u.userId}')">edit</span>
            <span class="material-symbols-outlined delete" onclick="removeUser('${u.userId}')">delete</span>
          </div>

        </div>

        <div class="member-body">
          <div class="info-grid">

            <div class="info-item">
              <span class="material-symbols-outlined">cake</span>
              <div>
                <label>อายุ</label>
                <p>${age || "-"} ปี</p>
              </div>
            </div>

            <div class="info-item">
              <span class="material-symbols-outlined">phone</span>
              <div>
                <label>โทรศัพท์</label>
                <p>${u.phone || "-"}</p>
              </div>
            </div>

            <div class="info-item">
              <span class="material-symbols-outlined">emoji_events</span>
              <div>
                <label>คะแนน</label>
                <p>${u.point || 0}</p>
              </div>
            </div>

            <div class="info-item">
              <span class="material-symbols-outlined">sports_tennis</span>
              <div>
                <label>ระดับ</label>
                <span class="badge ${getLevelClass(u.level)}">
                  ${u.level || "-"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderPagination(totalPages) {
  if (totalPages <= 1) return "";

  let html = `<div class="pagination">`;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? "active" : ""}"
        onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  html += `</div>`;
  return html;
}

function changePage(page) {
  currentPage = page;
  loadMembers();
}

function calculateAge(birthday) {
  if (!birthday) return null;

  const birth = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function getLevelClass(level) {
  switch (level) {
    case "P+":
      return "badge-pplus";
    case "P":
      return "badge-p";
    case "S+":
      return "badge-splus";
    case "S":
      return "badge-s";
    case "BG+":
      return "badge-bgplus";
    case "BG":
      return "badge-bg";
    default:
      return "badge-bg";
  }
}

async function removeUser(userId) {
  if (!confirm("ยืนยันการลบสมาชิกนี้?")) {
    return;
  }

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "deleteUser",
      userId: userId,
    }),
  });

  const data = await res.json();

  if (data.success) {
    alert("ลบสำเร็จ");
    await loadMembers();
  }
}

async function addMember() {
  if (requestLock) return; // 🔥 กันกดซ้ำ
  requestLock = true;

  const btn = document.querySelector("#memberModal .btn-primary");
  const originalText = btn.innerText;

  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  const nick = document.getElementById("newNick").value.trim();
  const real = document.getElementById("newReal").value.trim();
  const phone = document.getElementById("newPhone").value.trim();
  const birth = document.getElementById("newBirth").value;

  let valid = true;

  document.getElementById("newPhoneError").innerText = "";
  document.getElementById("newBirthError").innerText = "";
  document.getElementById("newPhone").classList.remove("input-error");
  document.getElementById("newBirth").classList.remove("input-error");

  if (!nick || !real || !phone || !birth) {
    alert("กรอกข้อมูลให้ครบก่อน");
    valid = false;
  }

  const phoneRegex = /^0[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    document.getElementById("newPhoneError").innerText =
      "กรอกเบอร์โทรให้ถูกต้อง (10 หลัก)";
    document.getElementById("newPhone").classList.add("input-error");
    valid = false;
  }

  const birthDate = new Date(birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 6) {
    document.getElementById("newBirthError").innerText =
      "กรุณาใส่อายุให้ถูกต้อง";
    document.getElementById("newBirth").classList.add("input-error");
    valid = false;
  }

  if (!valid) {
    btn.innerText = originalText;
    btn.disabled = false;
    requestLock = false;
    return;
  }

  try {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: editingUserId ? "updateUser" : "addManualUser",
        userId: editingUserId,
        nickName: nick,
        realName: real,
        phone: phone,
        birthday: birth,
        level: document.getElementById("newLevel").value,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast("บันทึกสำเร็จ");
      closeModal();
      loadMembers();
    } else {
      alert("เกิดข้อผิดพลาด");
    }
  } catch (err) {
    alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }

  btn.innerText = originalText;
  btn.disabled = false;
  requestLock = false;
}

function handleSearch() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  if (!keyword) {
    currentPage = 1;
    renderMembers(allUsers); // ✅ คืนค่าทั้งหมด
    return;
  }

  const filtered = allUsers.filter(
    (u) =>
      (u.nickName || "").toLowerCase().includes(keyword) ||
      (u.realName || "").toLowerCase().includes(keyword),
  );

  currentPage = 1;
  renderMembers(filtered);
}

function showAddForm() {
  editingUserId = null;

  document.getElementById("modalTitle").innerText = "เพิ่มสมาชิก";

  document.getElementById("newNick").value = "";
  document.getElementById("newReal").value = "";
  document.getElementById("newPhone").value = "";
  document.getElementById("newBirth").value = "";
  document.getElementById("newLevel").value = "Beginner";

  document.getElementById("memberModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("memberModal").style.display = "none";
}

function editUser(userId) {
  const user = allUsers.find((u) => u.userId === userId);
  if (!user) return;

  editingUserId = userId;

  document.getElementById("modalTitle").innerText = "แก้ไขสมาชิก";

  document.getElementById("newNick").value = user.nickName || "";
  document.getElementById("newReal").value = user.realName || "";
  document.getElementById("newPhone").value = user.phone || "";
  if (user.birthday) {
    const date = new Date(user.birthday);

    const formatted =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");

    document.getElementById("newBirth").value = formatted;
  } else {
    document.getElementById("newBirth").value = "";
  }
  document.getElementById("newLevel").value = user.level || "Beginner";

  document.getElementById("memberModal").style.display = "flex";
}

function renderMemberPage() {
  const pageContent = document.getElementById("pageContent");

  pageContent.innerHTML = `
    <div class="member-page">

      <div class="page-header header-flex">
        <div>
          <h2>จัดการสมาชิก</h2>
          <p class="page-sub">ดูและแก้ไขข้อมูลสมาชิกทั้งหมด</p>
        </div>

        <button class="add-btn" onclick="showAddForm()">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>

      <div class="member-search">
        <input type="text" id="searchInput"
          placeholder="ค้นหาชื่อ..."
          oninput="handleSearch()">
      </div>

      <div id="paginationTop"></div>

      <div class="member-scroll">
        <div id="memberList"></div>
      </div>

    </div>
  `;

  currentPage = 1;
  loadMembers();
}
