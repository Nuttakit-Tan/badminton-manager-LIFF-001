let currentUser = null;

document.addEventListener("DOMContentLoaded", function(){

  liff.init({ liffId: CONFIG.LIFF_ID })
  .then(() => {

    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return;
    }

    return liff.getProfile();
  })
  .then(profile => {

    if(!profile) return;

    currentUser = profile;

    document.body.style.display = "block";

    document.getElementById("username").innerText =
      "สวัสดี " + profile.displayName;

    checkUser(profile.userId);
  });

});

function checkUser(userId){

  fetch(CONFIG.API_URL, {
    method:"POST",
    body: JSON.stringify({
      action:"checkUser",
      userId:userId
    })
  })
  .then(r=>r.json())
  .then(res=>{

    if(!res.exists){
      registerLineUser(currentUser);
      showRegisterForm(currentUser);
    }else{
      loadPage("members", document.querySelector(".menu li"));
    }

  });

}

function registerLineUser(profile){

  fetch(CONFIG.API_URL,{
    method:"POST",
    body: JSON.stringify({
      action:"registerLineUser",
      userId: profile.userId,
      lineDisplayName: profile.displayName,
      linePictureUrl: profile.pictureUrl
    })
  });

}

function showRegisterForm(profile) {

  document.getElementById("pageContent").innerHTML = `
  
  <h2>สมัครสมาชิกครั้งแรก</h2>

  <div class="card">

    <label>ชื่อเล่น</label>
    <input id="nickName">

    <label>ชื่อจริง</label>
    <input id="realName">

    <label>เบอร์โทรศัพท์</label>
    <input id="phone">

    <label>วันเกิด</label>
    <input id="birthday" type="date">

    <label>ระดับมือ</label>
    <select id="level">
      <option value="Beginner">Beginner</option>
      <option value="P">P</option>
      <option value="P+">P+</option>
      <option value="S">S</option>
    </select>

    <button onclick="registerUser()" class="btn-primary">
      บันทึกข้อมูล
    </button>

  </div>
  `;
}

function registerUser(){

  fetch(CONFIG.API_URL,{
    method:"POST",
    body: JSON.stringify({
      action:"registerUser",
      userId: currentUser.userId,
      lineDisplayName: currentUser.displayName,
      linePictureUrl: currentUser.pictureUrl,
      nickName: document.getElementById("nickName").value,
      realName: document.getElementById("realName").value,
      phone: document.getElementById("phone").value,
      birthday: document.getElementById("birthday").value,
      level: document.getElementById("level").value
    })
  })
  .then(res=>res.json())
  .then(res=>{

    alert("สมัครสมาชิกสำเร็จ 🎉");

    loadPage("members", document.querySelector(".menu li"));

  });

}