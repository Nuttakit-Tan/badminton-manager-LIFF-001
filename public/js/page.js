let currentPage = 1;
const perPage = 10;
let editingUserId = null;
let currentLots = [];
let currentProductId = null;
let currentProducts = [];
let requestLock = false;

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
    <span class="material-icons">add</span>
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
      pageContent.innerHTML = `
    <div class="member-page">

      <div class="page-header header-flex">
        <div>
          <h2>จัดการลูกแบด</h2>
          <p class="page-sub">เพิ่มยี่ห้อ และจัดการ Lot สต็อก</p>
        </div>

        <button class="add-btn" onclick="showAddProduct()">
          <span class="material-icons">add</span>
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

  let valid = true;

  // ล้าง error เก่า
  document.getElementById("newPhoneError").innerText = "";
  document.getElementById("newBirthError").innerText = "";

  document.getElementById("newPhone").classList.remove("input-error");
  document.getElementById("newBirth").classList.remove("input-error");

  if (!nick || !real || !phone || !birth) {
    alert("กรอกข้อมูลให้ครบก่อน");
    return;
  }

  // 🔥 ตรวจเบอร์โทร
  const phoneRegex = /^0[0-9]{9}$/;

  if (!phoneRegex.test(phone)) {
    document.getElementById("newPhoneError").innerText =
      "กรอกเบอร์โทรให้ถูกต้อง (10 หลัก)";
    document.getElementById("newPhone").classList.add("input-error");
    valid = false;
  }

  // 🔥 ตรวจอายุขั้นต่ำ 6 ปี
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

  if (!valid) return;

  // 🔥 ส่งข้อมูล
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
