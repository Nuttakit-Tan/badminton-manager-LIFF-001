/*/function loadPage(page, el) {
  if (window.mustCompleteProfile) {
    alert("กรอกข้อมูลให้ครบก่อน");
    return;
  }

  // ลบ active ออกจากเมนูทั้งหมด
  document.querySelectorAll(".menu li").forEach((li) => {
    li.classList.remove("active");
  });

  // ใส่ active ให้เมนูที่กด
  if (el) {
    el.classList.add("active");
  }

  // แสดงหน้าตามที่เลือก
  const content = document.getElementById("pageContent");

  if (page === "members") {
    content.innerHTML = `
      <h2>หน้ารายชื่อสมาชิก</h2>
      <p>โหลดข้อมูลสมาชิกตรงนี้</p>
    `;
  }

  if (page === "session") {
    content.innerHTML = "<h2>หน้าจัดก๊วน</h2>";
  }

  if (page === "shuttle") {
    content.innerHTML = "<h2>หน้าลูกแบด</h2>";
  }

  if (page === "history") {
    content.innerHTML = "<h2>หน้าประวัติ</h2>";
  }

  if (page === "payment") {
    content.innerHTML = "<h2>หน้าชำระเงิน</h2>";
  }
}/*/

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
    const pageContent = document.getElementById("pageContent");

    if (page === "members") {
      pageContent.innerHTML = `
        <h2>หน้ารายชื่อสมาชิก</h2>
        <p>โหลดข้อมูลสมาชิกตรงนี้</p>
      `;
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
