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

document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "confirmBtn") {
    if (confirmCallback) {
      confirmCallback();
    }
    closeConfirm();
  }
});

function renderShuttlePage() {
  const pageContent = document.getElementById("pageContent");

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
        <select id="productSelect"
          onchange="selectProduct()"
          style="width:100%; padding:12px; border-radius:12px; border:1px solid #ddd;">
          <option value="">-- ยังไม่มีสินค้า --</option>
        </select>
      </div>

      <div id="lotSection" style="margin-top:20px;"></div>

    </div>
  `;

  loadShuttleProducts();
}
