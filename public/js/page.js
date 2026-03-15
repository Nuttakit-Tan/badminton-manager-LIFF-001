let currentPage = 1;
const perPage = 10;
let editingUserId = null;

function setupSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("menuToggle");
  const overlay = document.getElementById("overlay");

  // 🔥 เริ่มต้นปิดเสมอ
  sidebar.classList.add("collapsed");
  overlay.classList.remove("show");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.add("collapsed");
    overlay.classList.remove("show");
  });
}

function loadPage(page, el) {
  if (window.mustCompleteProfile) {
    alert("กรอกข้อมูลให้ครบก่อน");
    return;
  }

  document.querySelectorAll(".menu li").forEach((li) => {
    li.classList.remove("active");
  });

  if (el) {
    el.classList.add("active");
  }

  const content = document.querySelector(".content");

  content.classList.add("fade-out");

  setTimeout(() => {
    const floatingBtn = document.querySelector(".floating-btn");
    floatingBtn.style.display = "none";
    const pageContent = document.getElementById("pageContent");

    if (page === "members") {
      pageContent.innerHTML = `
    <div class="member-page">

      <div class="page-header">
        <h2>จัดการสมาชิก</h2>
        <p class="page-sub">ดูและแก้ไขข้อมูลสมาชิกทั้งหมด</p>
      </div>

      <div class="member-search">
        <input type="text" id="searchInput" placeholder="ค้นหาชื่อ..."
          oninput="handleSearch()">
      </div>

      <div class="member-scroll">
        <div id="memberList"></div>
      </div>

    </div>
  `;

      currentPage = 1;
      loadMembers();

      floatingBtn.style.display = "flex";
      floatingBtn.onclick = showAddForm;
    }
    if (page === "join") {
      pageContent.innerHTML = `
    <h2>เข้าร่วมก๊วน</h2>

    <div class="card">
      <p>กดปุ่มเพื่อเข้าร่วมรอบวันนี้</p>
      <button class="btn-primary" onclick="joinSession()">
        เข้าร่วม
      </button>
    </div>
  `;
    }

    if (page === "session") {
      pageContent.innerHTML = "<h2>หน้าจัดก๊วน</h2>";
    }

    if (page === "shuttle") {
      pageContent.innerHTML = "<h2>หน้าลูกแบด</h2>";
    }

    if (page === "history") {
      pageContent.innerHTML = "<h2>หน้าประวัติ</h2>";
    }

    if (page === "payment") {
      pageContent.innerHTML = "<h2>หน้าชำระเงิน</h2>";
    }

    content.classList.remove("fade-out");
    content.classList.add("fade-in");
  }, 200);
}

let allUsers = [];

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

  const total = users.length;
  const totalPages = Math.ceil(total / perPage);

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  const pageUsers = users.slice(start, end);

  let html = "";

  pageUsers.forEach((u) => {
    const age = calculateAge(u.birthday);

    const avatar =
      u.isLineUser && u.linePictureUrl
        ? `<img src="${u.linePictureUrl}" class="avatar">`
        : `<div class="avatar placeholder">
            <span class="material-icons">person</span>
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
            <span class="material-icons edit" onclick="editUser('${u.userId}')">edit</span>
            <span class="material-icons delete" onclick="removeUser('${u.userId}')">delete</span>
          </div>

        </div>

        <div class="member-body">
          <div class="info-grid">

            <div class="info-item">
              <span class="material-icons">cake</span>
              <div>
                <label>อายุ</label>
                <p>${age || "-"} ปี</p>
              </div>
            </div>

            <div class="info-item">
              <span class="material-icons">phone</span>
              <div>
                <label>โทรศัพท์</label>
                <p>${u.phone || "-"}</p>
              </div>
            </div>

            <div class="info-item">
              <span class="material-icons">emoji_events</span>
              <div>
                <label>คะแนน</label>
                <p>${u.point || 0}</p>
              </div>
            </div>

            <div class="info-item">
              <span class="material-icons">sports_tennis</span>
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

  html += renderPagination(totalPages);

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
    case "S":
      return "badge-s";
    case "P+":
      return "badge-pplus";
    case "P":
      return "badge-p";
    default:
      return "badge-beginner";
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
  const nick = document.getElementById("newNick").value.trim();
  const real = document.getElementById("newReal").value.trim();
  const phone = document.getElementById("newPhone").value.trim();
  const birth = document.getElementById("newBirth").value;

  if (!nick || !real || !phone || !birth) {
    alert("กรอกข้อมูลให้ครบ");
    return;
  }

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
    alert("บันทึกสำเร็จ");
    closeModal();
    loadMembers();
  } else {
    alert("เกิดข้อผิดพลาด");
  }
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
  document.getElementById("newBirth").value = user.birthday || "";
  document.getElementById("newLevel").value = user.level || "Beginner";

  document.getElementById("memberModal").style.display = "flex";
}
