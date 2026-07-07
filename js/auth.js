const CURRENT_USER_KEY = "fittrack_current_user";

function getCurrentUser() {
  const rawUser = localStorage.getItem(CURRENT_USER_KEY);
  if (!rawUser) return null;
  try { return JSON.parse(rawUser); }
  catch { localStorage.removeItem(CURRENT_USER_KEY); return null; }
}

function setCurrentUser(user) { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)); }
function logoutUser() { localStorage.removeItem(CURRENT_USER_KEY); localStorage.setItem("fittrack_flash_message", "Đăng xuất thành công"); window.location.href = "login.html"; }
function showFlashMessage() { const m=localStorage.getItem("fittrack_flash_message"); if(!m)return; localStorage.removeItem("fittrack_flash_message"); setTimeout(()=>showToast(m,"success"),250); }
function requireLogin(){ const u=getCurrentUser(); if(!u){ localStorage.setItem("fittrack_flash_message","Vui lòng đăng nhập để sử dụng FitTrack"); window.location.href="login.html"; return null;} return u; }
function requireAdmin(){ const u=requireLogin(); if(!u)return null; if(u.role!=="admin"){ localStorage.setItem("fittrack_flash_message","Bạn không có quyền truy cập trang quản trị"); window.location.href="index.html"; return null;} return u; }
function redirectIfLoggedIn(){ const u=getCurrentUser(); if(u) window.location.href = u.role === "admin" ? "admin.html" : "index.html"; }

function renderAuthNavbar(activePage){
  const u=getCurrentUser(); const nav=document.getElementById("authNav"); if(!nav)return;
  if(!u){ nav.innerHTML=`<li class="nav-item"><a class="nav-link ${activePage==='login'?'active':''}" href="login.html">Đăng nhập</a></li><li class="nav-item"><a class="btn btn-success ms-lg-2 mt-2 mt-lg-0" href="register.html">Đăng ký</a></li>`; return; }
  const adminLink = u.role === "admin" ? `<li class="nav-item"><a class="nav-link ${activePage==='admin'?'active':''}" href="admin.html">Quản trị</a></li>` : "";
  nav.innerHTML = `
    <li class="nav-item"><a class="nav-link ${activePage==='home'?'active':''}" href="index.html">Tổng quan</a></li>
    <li class="nav-item"><a class="nav-link ${activePage==='articles'?'active':''}" href="articles.html">Bài viết</a></li>
    <li class="nav-item"><a class="nav-link ${activePage==='profile'?'active':''}" href="profile.html">Hồ sơ</a></li>
    ${adminLink}
    <li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">👤 ${u.fullName||u.email}</a>
      <ul class="dropdown-menu dropdown-menu-end"><li><span class="dropdown-item-text small text-muted">${u.email}</span></li><li><span class="dropdown-item-text small text-muted">${u.phone||"Chưa có SĐT"}</span></li><li><hr class="dropdown-divider"></li><li><button class="dropdown-item text-danger" type="button" id="logoutBtn">Đăng xuất</button></li></ul>
    </li>`;
  const btn=document.getElementById("logoutBtn"); if(btn) btn.addEventListener("click", logoutUser);
}

function isValidEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function normalizePhone(phone){ return String(phone||"").replace(/\s|\.|-/g,""); }
function isValidPhone(phone){ const p=normalizePhone(phone); return /^(0|\+84)[0-9]{9,10}$/.test(p); }

function getRegisterFormData(){ return { fullName:$("#fullName").val().trim(), email:$("#email").val().trim().toLowerCase(), phone:normalizePhone($("#phone").val()), password:$("#password").val(), confirmPassword:$("#confirmPassword").val(), age:Number($("#age").val()), gender:$("#gender").val(), height:Number($("#height").val()), weight:Number($("#weight").val()), goal:$("#goal").val() }; }
function validateRegisterForm(d){ const e={}; if(!d.fullName)e.fullName="Họ tên không được để trống"; if(!d.email)e.email="Email không được để trống"; else if(!isValidEmail(d.email))e.email="Email không đúng định dạng"; if(!d.phone)e.phone="Số điện thoại không được để trống"; else if(!isValidPhone(d.phone))e.phone="Số điện thoại không hợp lệ"; if(!d.password)e.password="Mật khẩu không được để trống"; else if(d.password.length<6)e.password="Mật khẩu phải có ít nhất 6 ký tự"; if(d.confirmPassword!==d.password)e.confirmPassword="Mật khẩu xác nhận không khớp"; if(!d.age||d.age<=0)e.age="Tuổi phải lớn hơn 0"; if(!d.gender)e.gender="Vui lòng chọn giới tính"; if(!d.height||d.height<=0)e.height="Chiều cao phải lớn hơn 0"; if(!d.weight||d.weight<=0)e.weight="Cân nặng phải lớn hơn 0"; if(!d.goal)e.goal="Vui lòng chọn mục tiêu tập luyện"; return {isValid:Object.keys(e).length===0, errors:e}; }

function initRegisterPage(){
  redirectIfLoggedIn(); renderAuthNavbar("register"); showFlashMessage();
  $("#registerForm").on("submit", function(ev){ ev.preventDefault(); clearErrors(); const d=getRegisterFormData(); const v=validateRegisterForm(d); if(!v.isValid){ Object.keys(v.errors).forEach(f=>showFieldError(f,v.errors[f])); return showToast("Vui lòng kiểm tra lại thông tin đăng ký","error"); }
    $("#registerBtn").prop("disabled",true).text("Đang tạo tài khoản...");
    getUsersByAjax().then(function(users){
      users = users || [];
      const emailExists = users.some(u=>String(u.email||"").toLowerCase()===d.email);
      const phoneExists = users.some(u=>normalizePhone(u.phone)===d.phone);
      if(emailExists){ showFieldError("email","Email này đã được đăng ký"); throw "EMAIL_EXISTS"; }
      if(phoneExists){ showFieldError("phone","Số điện thoại này đã được đăng ký"); throw "PHONE_EXISTS"; }
      return createUser({ fullName:d.fullName,email:d.email,phone:d.phone,password:d.password,age:d.age,gender:d.gender,height:d.height,weight:d.weight,targetWeight:d.weight,weeklyWorkoutGoal:4,dailyWaterGoal:2,goal:d.goal,role:d.email==="admin@gmail.com"?"admin":"user",createdAt:nowISOString(),updatedAt:nowISOString(),lastLoginAt:null });
    }).then(()=>{ localStorage.setItem("fittrack_flash_message","Đăng ký tài khoản thành công. Hãy đăng nhập để tiếp tục"); window.location.href="login.html"; })
    .catch(err=>{ if(err!=="EMAIL_EXISTS"&&err!=="PHONE_EXISTS") showToast("Không thể đăng ký tài khoản. Vui lòng thử lại","error"); })
    .finally(()=>$("#registerBtn").prop("disabled",false).text("Đăng ký tài khoản"));
  });
}

function initLoginPage(){
  redirectIfLoggedIn(); renderAuthNavbar("login"); showFlashMessage();
  $("#loginForm").on("submit", function(ev){ ev.preventDefault(); clearErrors(); const email=$("#email").val().trim().toLowerCase(); const password=$("#password").val(); let bad=false; if(!email){showFieldError("email","Email không được để trống"); bad=true;} if(!password){showFieldError("password","Mật khẩu không được để trống"); bad=true;} if(bad)return; $("#loginBtn").prop("disabled",true).text("Đang đăng nhập...");
    getUsers().then(function(users){ const found=(users||[]).find(u=>String(u.email||"").toLowerCase()===email && String(u.password)===String(password)); if(!found){ showToast("Email hoặc mật khẩu không chính xác","error"); return; } const updated={...found,lastLoginAt:nowISOString()}; setCurrentUser(updated); updateUser(found.id, updated).catch(()=>{}); localStorage.setItem("fittrack_flash_message","Đăng nhập thành công"); window.location.href=found.role==="admin"?"admin.html":"index.html"; })
    .catch(()=>showToast("Không thể đăng nhập. Hãy kiểm tra MockAPI users","error"))
    .finally(()=>$("#loginBtn").prop("disabled",false).text("Đăng nhập"));
  });
}

function initForgotPasswordPage(){
  redirectIfLoggedIn(); showFlashMessage();
  $("#forgotForm").on("submit", function(ev){ ev.preventDefault(); clearErrors(); const email=$("#resetEmail").val().trim().toLowerCase(); const phone=normalizePhone($("#resetPhone").val()); const pass=$("#newPassword").val(); const confirm=$("#confirmNewPassword").val(); let bad=false; if(!email||!isValidEmail(email)){showFieldError("resetEmail","Nhập email hợp lệ"); bad=true;} if(!phone||!isValidPhone(phone)){showFieldError("resetPhone","Nhập số điện thoại hợp lệ"); bad=true;} if(!pass||pass.length<6){showFieldError("newPassword","Mật khẩu mới tối thiểu 6 ký tự"); bad=true;} if(pass!==confirm){showFieldError("confirmNewPassword","Mật khẩu xác nhận không khớp"); bad=true;} if(bad)return;
    $("#resetBtn").prop("disabled",true).text("Đang cập nhật...");
    getUsers().then(users=>{ const user=(users||[]).find(u=>String(u.email||"").toLowerCase()===email && normalizePhone(u.phone)===phone); if(!user){ showToast("Không tìm thấy tài khoản khớp email và số điện thoại","error"); return; } const updated={...user,password:pass,updatedAt:nowISOString(),passwordChangedAt:nowISOString()}; return updateUser(user.id, updated).then(()=>{localStorage.setItem("fittrack_flash_message","Đổi mật khẩu thành công. Hãy đăng nhập lại"); window.location.href="login.html";}); })
    .catch(()=>showToast("Không thể đổi mật khẩu","error"))
    .finally(()=>$("#resetBtn").prop("disabled",false).text("Đặt lại mật khẩu"));
  });
}
