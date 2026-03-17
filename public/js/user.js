let currentUser = null;
let mustCompleteProfile = false;

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loadingScreen").style.display = "flex";

  liff
    .init({ liffId: CONFIG.LIFF_ID })
    .then(() => {
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      return liff.getProfile();
    })
    .then((profile) => {
      if (!profile) return;

      currentUser = profile;

      setTimeout(() => {
        setupSidebar();
      }, 0);

      document.getElementById("username").innerHTML =
        `👋 สวัสดี, <strong>${profile.displayName}</strong>`;

      checkUser(profile.userId);
    });
});

function checkUser(userId) {
  fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "checkUser",
      userId: userId,
    }),
  })
    .then((r) => r.json())
    .then((res) => {
      if (!res.exists) {
        mustCompleteProfile = true;
        registerLineUser(currentUser);
        showRegisterForm(currentUser);
      } else {
        if (!res.isComplete) {
          mustCompleteProfile = true;
          showRegisterForm(currentUser);
        } else {
          mustCompleteProfile = false;

          if (res.role === "admin") {
            loadPage("members", document.getElementById("menuMembers"));
          } else {
            // 🔥 ซ่อนเมนูสมาชิก
            document.getElementById("menuMembers").style.display = "none";

            loadPage("join", null);
          }
        }
      }

      // ✅ ซ่อน Loading หลังเช็คเสร็จทุกกรณี
      document.getElementById("loadingScreen").style.display = "none";
    });
}

function registerLineUser(profile) {
  fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "registerLineUser",
      userId: profile.userId,
      lineDisplayName: profile.displayName,
      linePictureUrl: profile.pictureUrl,
    }),
  });
}

function showRegisterForm(profile) {
  mustCompleteProfile = true;

  document.querySelector(".sidebar").style.display = "none";

  // 🔥 ซ่อนปุ่ม
  document.getElementById("menuToggle").style.display = "none";
  document.getElementById("pageContent").innerHTML = `
    <h2 class="register-title">กรอกข้อมูล 5</h2>

    <div class="card">

  <label>ชื่อเล่น</label>
  <input id="nickName">

  <label>ชื่อจริง</label>
  <input id="realName">

  <label>เบอร์โทรศัพท์</label>
  <input id="phone" type="tel" maxlength="10">
  <div id="phoneError" class="error-text"></div>

  <label>วันเกิด</label>
  <input id="birthday" type="date">
  <div id="birthdayError" class="error-text"></div>

  <label>ระดับมือ</label>
  <select id="level">
    <option value="Beginner">Beginner</option>
    <option value="S">S</option>
    <option value="P">P</option>
    <option value="P+">P+</option>
  </select>

  <button onclick="registerUser()" class="btn-primary">
    บันทึกข้อมูล
  </button>

</div>
  `;
}

function registerUser() {
  const nick = document.getElementById("nickName").value.trim();
  const real = document.getElementById("realName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const birthday = document.getElementById("birthday").value;

  let valid = true;

  // ล้าง error เก่า
  document.getElementById("phoneError").innerText = "";
  document.getElementById("birthdayError").innerText = "";

  document.getElementById("phone").classList.remove("input-error");
  document.getElementById("birthday").classList.remove("input-error");

  if (!nick || !real || !phone || !birthday) {
    alert("กรอกข้อมูลให้ครบก่อน");
    return;
  }

  // ========================
  // ตรวจเบอร์โทร
  // ========================

  const phoneRegex = /^0[0-9]{9}$/;

  if (!phoneRegex.test(phone)) {
    document.getElementById("phoneError").innerText = "กรอกเบอร์โทรให้ถูกต้อง";
    document.getElementById("phone").classList.add("input-error");
    valid = false;
  }

  // ========================
  // ตรวจอายุขั้นต่ำ 6 ปี
  // ========================

  const birthDate = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 6) {
    document.getElementById("birthdayError").innerText =
      "กรุณาใส่อายุให้ถูกต้อง";
    document.getElementById("birthday").classList.add("input-error");
    valid = false;
  }

  // ถ้ามี error ไม่ต้องส่งข้อมูล
  if (!valid) {
    return;
  }

  // ========================
  // ส่งข้อมูล
  // ========================

  document.getElementById("loadingScreen").style.display = "flex";

  fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "registerUser",
      userId: currentUser.userId,
      lineDisplayName: currentUser.displayName,
      linePictureUrl: currentUser.pictureUrl,
      nickName: nick,
      realName: real,
      phone: phone,
      birthday: birthday,
      level: document.getElementById("level").value,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        mustCompleteProfile = false;

        const sidebar = document.querySelector(".sidebar");
        sidebar.style.display = "block";
        sidebar.classList.add("collapsed");

        document.getElementById("overlay").classList.remove("show");
        document.getElementById("menuToggle").style.display = "inline-block";

        // 🔥 ล้างหน้า register ทันที (กันเด้งกลับ)
        document.getElementById("pageContent").innerHTML = "";

        // 🔥 แสดง loading สั้น ๆ ให้ transition นุ่ม
        document.getElementById("loadingScreen").style.display = "flex";

        setTimeout(() => {
          document.getElementById("loadingScreen").style.display = "none";

          if (res.role === "admin") {
            loadPage("members", document.getElementById("menuMembers"));
          } else {
            document.getElementById("menuMembers").style.display = "none";
            loadPage("join", null);
          }
        }, 200); // delay เล็กน้อยพอ
      } else {
        document.getElementById("loadingScreen").style.display = "none";
        alert("เกิดข้อผิดพลาด");
      }
    })
    .catch(() => {
      document.getElementById("loadingScreen").style.display = "none";
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    });
}

function joinSession() {
  alert("TODO: เขียน API เข้าร่วมก๊วน");
}
