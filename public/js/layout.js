function setupSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("menuToggle");
  const overlay = document.getElementById("overlay");

  sidebar.classList.add("collapsed");

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

  if (el) el.classList.add("active");

  const content = document.querySelector(".content");
  content.classList.add("fade-out");

  setTimeout(() => {
    const pageMap = {
      members: typeof renderMemberPage === "function" ? renderMemberPage : null,
      session:
        typeof renderSessionCreatePage === "function"
          ? renderSessionCreatePage
          : null,
      shuttle:
        typeof renderShuttlePage === "function" ? renderShuttlePage : null,
      join: typeof renderJoinPage === "function" ? renderJoinPage : null,
      history:
        typeof renderHistoryPage === "function" ? renderHistoryPage : null,
      payment:
        typeof renderPaymentPage === "function" ? renderPaymentPage : null,
    };

    if (pageMap[page]) {
      pageMap[page]();
    } else {
      console.warn("Page function not found:", page);
      document.getElementById("pageContent").innerHTML =
        "<h2>หน้านี้ยังไม่พร้อมใช้งาน</h2>";
    }

    content.classList.remove("fade-out");
    content.classList.add("fade-in");
  }, 200);
}
