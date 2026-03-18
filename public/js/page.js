let currentPage = 1;
const perPage = 10;
let editingUserId = null;
let currentLots = [];
let currentProductId = null;
let currentProducts = [];
let requestLock = false;
let currentSessionId = null;
let participantUsers = [];
let participantPage = 1;
const participantPerPage = 10;
let currentMaxPlayer = null;
let currentCount = 0;

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
  if (typeof mustCompleteProfile !== "undefined" && mustCompleteProfile) {
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
    const pageContent = document.getElementById("pageContent");

    if (page === "members") {
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
        <input type="text" id="searchInput" placeholder="ค้นหาชื่อ..."
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
    if (page === "join") {
      pageContent.innerHTML = `
    <h2>เข้าร่วมก๊วน</h2>

    <div class="card">
      <button class="btn-primary" onclick="joinCurrentSession()">
        เข้าร่วม
      </button>
    </div>
  `;

      loadCurrentSession();
    }

    if (page === "session") {
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
        <input id="entryFee" type="number" min="0">

        <button onclick="createSession()" class="btn-primary">
          สร้างก๊วน
        </button>

        <div style="margin-top:15px;">
  <button onclick="closeCurrentSession()" 
          class="btn-danger-sm">
    ปิดก๊วน
  </button>
</div>

      </div>
    </div>
  `;

      loadSessionProducts();
    }

    if (page === "shuttle") {
      pageContent.innerHTML = `
    <div class="member-page">

      <div class="page-header header-flex">
        <div>
          <h2>จัดการลูกแบด</h2>
          <p class="page-sub">เพิ่มยี่ห้อ และจัดการ Lot สต็อก</p>
        </div>

        <button class="add-btn" onclick="showAddProduct()">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>

      <div style="margin-top:15px;">
        <label>เลือกสินค้า</label>
        <select id="productSelect" onchange="selectProduct()" style="width:100%; padding:12px; border-radius:12px; border:1px solid #ddd;">
          <option value="">-- ยังไม่มีสินค้า --</option>
        </select>
      </div>

      <div id="lotSection" style="margin-top:20px;"></div>

    </div>
  `;

      loadShuttleProducts();
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

async function loadShuttleProducts() {
  const select = document.getElementById("productSelect");
  showSectionLoading("lotSection");

  const res = await apiCall("getShuttleProducts");
  currentProducts = res.products;

  select.innerHTML = "";

  if (!res.products || res.products.length === 0) {
    select.innerHTML = `<option value="">-- ยังไม่มีสินค้า --</option>`;
    document.getElementById("lotSection").innerHTML = "";
    return;
  }

  select.innerHTML = `<option value="">-- เลือกสินค้า --</option>`;

  res.products.forEach((p) => {
    select.innerHTML += `
      <option value="${p.productId}">
        ${p.brand} ${p.model} (${p.shuttlePerTube} ลูก/หลอด)
      </option>
    `;
  });

  document.getElementById("lotSection").innerHTML = "";
}

function showAddProduct() {
  document.getElementById("shuttleModalContent").innerHTML = `
    <h3>เพิ่มสินค้า</h3>

    <label>ยี่ห้อ</label>
    <input id="brand">

    <label>รุ่น</label>
    <input id="model">

    <label>ลูกต่อหลอด</label>
    <input id="shuttlePerTube" type="number" value="12" oninput="updateTubeLabel()">

    <div id="tubeLabel" style="margin-bottom:10px; color:#e07a5f; font-weight:600;">
      1 หลอด = 12 ลูก
    </div>

    <label>ราคาต่อลูก</label>
    <input id="pricePerShuttle" type="number">

    <div class="modal-actions">
      <button class="btn-primary" onclick="addProduct()">บันทึก</button>
      <button onclick="closeShuttleModal()">ยกเลิก</button>
    </div>
  `;

  document.getElementById("shuttleModal").style.display = "flex";
}

function updateTubeLabel() {
  const val = document.getElementById("shuttlePerTube").value || 0;
  document.getElementById("tubeLabel").innerText = "1 หลอด = " + val + " ลูก";
}

function closeShuttleModal() {
  document.getElementById("shuttleModal").style.display = "none";
}

async function addProduct() {
  if (requestLock) return;
  requestLock = true;

  const btn = document.querySelector("#shuttleModal .btn-primary");
  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addShuttleProduct",
      brand: document.getElementById("brand").value,
      model: document.getElementById("model").value,
      shuttlePerTube: document.getElementById("shuttlePerTube").value,
      pricePerShuttle: document.getElementById("pricePerShuttle").value,
    }),
  });

  requestLock = false;

  closeShuttleModal();
  showToast("เพิ่มสินค้าเรียบร้อย");

  loadShuttleProducts();
}

async function selectProduct() {
  const productId = document.getElementById("productSelect").value;
  const container = document.getElementById("lotSection");

  if (!productId) {
    container.innerHTML = "";
    return;
  }

  showSectionLoading("lotSection");

  const res = await apiCall("getShuttleDetail", { productId });

  currentLots = res.lots;
  currentProductId = productId;

  let html = `
    <div class="shuttle-card">

      <div class="header-flex">
        <div>
          <h3>คงเหลือทั้งหมด</h3>
          <div class="stock-number">${res.total} ลูก</div>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="btn-sm btn-outline-sm"
  onclick="editProduct('${productId}')">
  แก้ไขยี่ห้อ/รุ่น
</button>

          <button class="btn-sm btn-danger-sm"
  onclick="deleteProduct('${productId}')">
  ลบรายการ
</button>

          <button class="btn-sm btn-primary-sm"
  onclick="showAddLot('${productId}')">
  + เพิ่ม Lot
</button>
        </div>
      </div>

      <div style="margin-top:15px;">
  `;

  if (res.lots.length === 0) {
    html += `<p style="color:#888;">ยังไม่มี Lot</p>`;
  } else {
    res.lots.forEach((l) => {
      html += `
        <div class="lot-item">
          <div>
            Lot: ${l.lotId}<br>
            รวม ${l.totalShuttle} ลูก<br>
            เหลือ ${l.remainShuttle}
          </div>
          <div>
            <button class="btn-sm btn-outline-sm"
  onclick="editLot('${l.lotId}')">
  แก้ไข
</button>

<button class="btn-sm btn-danger-sm"
  onclick="deleteLot('${l.lotId}')">
  ลบ
</button>
          </div>
        </div>
      `;
    });
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

function editProduct(productId) {
  const product = currentProducts.find((p) => p.productId === productId);
  if (!product) return;

  document.getElementById("shuttleModalContent").innerHTML = `
    <h3>แก้ไขสินค้า</h3>

    <input id="editBrand" value="${product.brand}">
    <input id="editModel" value="${product.model}">
    <input id="editPerTube" type="number" value="${product.shuttlePerTube}">
    <input id="editPrice" type="number" value="${product.pricePerShuttle}">

    <div class="modal-actions">
      <button class="btn-primary"
        onclick="updateProduct('${productId}')">บันทึก</button>
      <button onclick="closeShuttleModal()">ยกเลิก</button>
    </div>
  `;

  document.getElementById("shuttleModal").style.display = "flex";
}

function deleteProduct(productId) {
  showConfirm("ต้องการลบสินค้านี้ใช่ไหม?", async function () {
    showSectionLoading("lotSection");

    await fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteShuttleProduct",
        productId: productId,
      }),
    });

    showToast("ลบสินค้าเรียบร้อย");

    loadShuttleProducts();
  });
}

function editLot(lotId) {
  const lot = currentLots.find((l) => l.lotId === lotId);
  if (!lot) return;

  document.getElementById("shuttleModalContent").innerHTML = `
    <h3>แก้ไข Lot</h3>

    <label>จำนวนหลอด</label>
    <input id="editTube" type="number" value="${lot.tubeQty}">

    <label>จำนวนลูก</label>
    <input id="editShuttle" type="number" value="${lot.shuttleQty}">

    <div class="modal-actions">
      <button class="btn-primary"
        onclick="updateLot('${lotId}')">
        บันทึก
      </button>
      <button onclick="closeShuttleModal()">ยกเลิก</button>
    </div>
  `;

  document.getElementById("shuttleModal").style.display = "flex";
}

function deleteLot(lotId) {
  showConfirm("ต้องการลบ Lot นี้ใช่ไหม?", async function () {
    await fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteShuttleLot",
        lotId: lotId,
      }),
    });

    showToast("ลบ Lot สำเร็จ");

    selectProduct();
  });
}

function showAddLot(productId) {
  document.getElementById("shuttleModalContent").innerHTML = `
    <h3>เพิ่ม Lot</h3>

    <label>จำนวนหลอด</label>
    <input id="lotTubeQty" type="number" value="0" oninput="calculateLotTotal()">

    <label>จำนวนลูก</label>
    <input id="lotShuttleQty" type="number" value="0" oninput="calculateLotTotal()">

    <div id="lotTotalDisplay"
         style="margin:10px 0; font-weight:600; color:#e07a5f;">
      รวมทั้งหมด: 0 ลูก
    </div>

    <div class="modal-actions">
      <button class="btn-primary"
        onclick="saveLot('${productId}')">
        บันทึก
      </button>
      <button onclick="closeShuttleModal()">ยกเลิก</button>
    </div>
  `;

  document.getElementById("shuttleModal").style.display = "flex";
}

let currentShuttlePerTube = 12;

function calculateLotTotal() {
  const product = currentProducts.find((p) => p.productId === currentProductId);
  if (!product) return;

  const tube = parseInt(document.getElementById("lotTubeQty").value) || 0;
  const shuttle = parseInt(document.getElementById("lotShuttleQty").value) || 0;

  const total = tube * product.shuttlePerTube + shuttle;

  document.getElementById("lotTotalDisplay").innerText =
    "รวมทั้งหมด: " + total + " ลูก";
}

async function saveLot(productId) {
  if (requestLock) return;
  requestLock = true;

  const btn = document.querySelector("#shuttleModal .btn-primary");
  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  const tubeQty = document.getElementById("lotTubeQty").value;
  const shuttleQty = document.getElementById("lotShuttleQty").value;

  if (Number(tubeQty) < 0 || Number(shuttleQty) < 0) {
    alert("จำนวนต้องไม่ติดลบ");
    requestLock = false;
    return;
  }

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addShuttleLot",
      productId: productId,
      tubeQty: tubeQty,
      shuttleQty: shuttleQty,
    }),
  });

  requestLock = false;

  closeShuttleModal();
  showToast("เพิ่ม Lot สำเร็จ");

  selectProduct();
}

function showSectionLoading(containerId) {
  document.getElementById(containerId).innerHTML = `
    <div class="section-loading">
      <div class="dot-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
}

let confirmCallback = null;

function showConfirm(message, callback) {
  document.getElementById("confirmMessage").innerText = message;
  confirmCallback = callback;
  document.getElementById("confirmModal").style.display = "flex";
}

function closeConfirm() {
  document.getElementById("confirmModal").style.display = "none";
  confirmCallback = null;
}

document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "confirmBtn") {
    if (confirmCallback) {
      confirmCallback();
    }
    closeConfirm();
  }
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

async function updateProduct(productId) {
  if (requestLock) return;
  requestLock = true;

  const btn = document.querySelector("#shuttleModal .btn-primary");
  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateShuttleProduct",
      productId: productId,
      brand: document.getElementById("editBrand").value,
      model: document.getElementById("editModel").value,
      shuttlePerTube: document.getElementById("editPerTube").value,
      pricePerShuttle: document.getElementById("editPrice").value,
    }),
  });

  requestLock = false;

  closeShuttleModal();
  showToast("แก้ไขสำเร็จ");

  loadShuttleProducts();
}

async function updateLot(lotId) {
  if (requestLock) return;
  requestLock = true;

  const btn = document.querySelector("#shuttleModal .btn-primary");
  btn.innerText = "กำลังบันทึก...";
  btn.disabled = true;

  const tubeQty = document.getElementById("editTube").value;
  const shuttleQty = document.getElementById("editShuttle").value;

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateShuttleLot",
      lotId: lotId,
      productId: currentProductId,
      tubeQty: tubeQty,
      shuttleQty: shuttleQty,
    }),
  });

  requestLock = false;

  closeShuttleModal();
  showToast("แก้ไข Lot สำเร็จ");

  selectProduct();
}

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

async function loadCurrentSession() {
  const res = await apiCall("getLatestSession");

  if (res.session) {
    currentSessionId = res.session.sessionId;
  }
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

async function loadParticipants() {
  const container = document.getElementById("participantTable");

  // 🔵 แสดง 3 จุดโหลดก่อน
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

  if (!res.participants || res.participants.length === 0) {
    html += `
    <tr>
      <td colspan="2" class="empty-row">
        ยังไม่มีผู้เข้าร่วม
      </td>
    </tr>
  `;
  } else {
    res.participants.forEach((p) => {
      html += `
      <tr>
        <td class="col-name">${p.nickName}</td>
        <td class="col-status">
          <span class="status-badge">${p.status}</span>
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
  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "cancelSession",
      sessionId: currentSessionId,
    }),
  });

  loadPage("session");
}

async function openAddParticipantModal() {
  await updateSessionInfo();
  const userRes = await apiCall("getUsers");
  const participantRes = await apiCall("getParticipants", {
    sessionId: currentSessionId,
  });

  const joinedIds = participantRes.participants.map((p) => p.userId);

  // 🔥 ตัดคนที่อยู่ในก๊วนแล้วออก
  participantUsers = (userRes.users || []).filter(
    (u) => !joinedIds.includes(u.userId),
  );

  participantPage = 1;

  renderParticipantPage();

  document.getElementById("participantModal").style.display = "flex";
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
  const checked = document.querySelectorAll(
    '#participantSelectList input[type="checkbox"]:checked',
  );

  if (checked.length === 0) {
    alert("กรุณาเลือกสมาชิก");
    return;
  }

  const userIds = [];

  checked.forEach((cb) => {
    userIds.push(cb.value);
  });

  const totalAfterAdd = currentCount + userIds.length;

  if (currentMaxPlayer && totalAfterAdd > currentMaxPlayer) {
    alert(`จำนวนเกิน ${currentMaxPlayer} คน`);
    return;
  }

  await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addMultipleParticipants",
      sessionId: currentSessionId,
      userIds: userIds,
    }),
  });

  closeParticipantModal();

  await loadParticipants(); // โหลดรายชื่อใหม่
  await updateSessionInfo();
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
