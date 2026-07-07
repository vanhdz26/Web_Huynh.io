let profileUser = null;
let profileWorkouts = [];

$(document).ready(function(){
  profileUser=requireLogin(); if(!profileUser)return;
  renderAuthNavbar("profile"); showFlashMessage(); fillProfileForm(profileUser); loadProfileWorkouts();
  $("#quickDate").val(toDateOnly(nowISOString()));
  $("#profileForm").on("submit",e=>{e.preventDefault(); updateProfileInfo();});
  $("#passwordForm").on("submit",e=>{e.preventDefault(); changeProfilePassword();});
  $("#quickWorkoutForm").on("submit",e=>{e.preventDefault(); addPersonalWorkout();});
});

function fillProfileForm(user){
  $("#profileName").val(user.fullName||""); $("#profileEmail").val(user.email||""); $("#profilePhone").val(user.phone||"");
  $("#profileAge").val(user.age||""); $("#profileGender").val(user.gender||""); $("#profileHeight").val(user.height||""); $("#profileWeight").val(user.weight||"");
  $("#profileGoal").val(user.goal||""); $("#profileTargetWeight").val(user.targetWeight||""); $("#profileWeeklyGoal").val(user.weeklyWorkoutGoal||4); $("#profileWaterGoal").val(user.dailyWaterGoal||2);
  $("#profileDisplayName").text(user.fullName||"Người dùng FitTrack"); $("#profileDisplayEmail").text(`${user.email||""}${user.phone ? " • " + user.phone : ""}`);
  $("#profileGoalBadge").text(user.goal||"Chưa cập nhật"); $("#profileRoleBadge").text(user.role==="admin"?"Admin":"User");
}

function getProfileFormData(){
  return {...profileUser,
    fullName:$("#profileName").val().trim(), phone:normalizePhone($("#profilePhone").val()),
    age:Number($("#profileAge").val()), gender:$("#profileGender").val(), height:Number($("#profileHeight").val()), weight:Number($("#profileWeight").val()),
    goal:$("#profileGoal").val(), targetWeight:Number($("#profileTargetWeight").val()||0), weeklyWorkoutGoal:Number($("#profileWeeklyGoal").val()||4), dailyWaterGoal:Number($("#profileWaterGoal").val()||2), updatedAt:nowISOString()
  };
}

function updateProfileInfo(){
  clearErrors(); const data=getProfileFormData(); const errors={};
  if(!data.fullName)errors.profileName="Họ tên không được để trống";
  if(!data.phone)errors.profilePhone="Số điện thoại không được để trống"; else if(!isValidPhone(data.phone)) errors.profilePhone="Số điện thoại không hợp lệ";
  if(!data.age||data.age<=0)errors.profileAge="Tuổi phải lớn hơn 0"; if(!data.gender)errors.profileGender="Vui lòng chọn giới tính";
  if(!data.height||data.height<=0)errors.profileHeight="Chiều cao phải lớn hơn 0"; if(!data.weight||data.weight<=0)errors.profileWeight="Cân nặng phải lớn hơn 0"; if(!data.goal)errors.profileGoal="Vui lòng chọn mục tiêu";
  if(Object.keys(errors).length){Object.keys(errors).forEach(f=>showFieldError(f,errors[f])); return showToast("Vui lòng kiểm tra lại hồ sơ","error");}
  $("#updateProfileBtn").prop("disabled",true).text("Đang kiểm tra...");
  getUsers().then(users=>{
    const phoneExists=(users||[]).some(u=>String(u.id)!==String(profileUser.id)&&normalizePhone(u.phone)===data.phone);
    if(phoneExists){ showFieldError("profilePhone","Số điện thoại này đã được tài khoản khác sử dụng"); throw "PHONE_EXISTS"; }
    $("#updateProfileBtn").text("Đang cập nhật..."); return updateUser(profileUser.id,data);
  }).then(u=>{profileUser=u; setCurrentUser(u); fillProfileForm(u); renderProfileStats(profileWorkouts); renderAuthNavbar("profile"); showToast("Cập nhật hồ sơ thành công","success");})
  .catch(err=>{ if(err!=="PHONE_EXISTS") showToast("Không thể cập nhật hồ sơ","error"); })
  .finally(()=>$("#updateProfileBtn").prop("disabled",false).text("Cập nhật hồ sơ"));
}

function changeProfilePassword(){
  clearErrors(); const oldPass=$("#oldPassword").val(); const newPass=$("#profileNewPassword").val(); const confirm=$("#profileConfirmPassword").val(); let bad=false;
  if(String(oldPass)!==String(profileUser.password)){ showFieldError("oldPassword","Mật khẩu hiện tại không đúng"); bad=true; }
  if(!newPass || newPass.length<6){ showFieldError("profileNewPassword","Mật khẩu mới tối thiểu 6 ký tự"); bad=true; }
  if(newPass!==confirm){ showFieldError("profileConfirmPassword","Xác nhận mật khẩu không khớp"); bad=true; }
  if(bad) return;
  const updated={...profileUser,password:newPass,passwordChangedAt:nowISOString(),updatedAt:nowISOString()};
  $("#changePasswordBtn").prop("disabled",true).text("Đang đổi...");
  updateUser(profileUser.id, updated).then(u=>{ profileUser=u; setCurrentUser(u); $("#passwordForm")[0].reset(); showToast("Đổi mật khẩu thành công","success"); })
  .catch(()=>showToast("Không thể đổi mật khẩu","error"))
  .finally(()=>$("#changePasswordBtn").prop("disabled",false).text("Đổi mật khẩu"));
}

function loadProfileWorkouts(){ showLoading("#profileLoading"); getWorkouts().then(data=>{ const all=Array.isArray(data)?data:[]; profileWorkouts=all.filter(w=>String(w.userId||"")===String(profileUser.id)).sort((a,b)=>new Date(b.date)-new Date(a.date)); renderProfileStats(profileWorkouts); renderProfileWorkoutList(profileWorkouts); }).catch(()=>showToast("Không thể tải lịch sử tập luyện","error")).finally(()=>hideLoading("#profileLoading")); }
function renderProfileStats(workouts){ const totalCalories=workouts.reduce((s,w)=>s+Number(w.calories||0),0); const totalDuration=workouts.reduce((s,w)=>s+Number(w.duration||0),0); const weekly=calculateWeeklyStats(workouts,profileUser); const latestWeight=workouts.find(w=>Number(w.weightToday)>0)?.weightToday || profileUser.weight; const bmi=calculateBMI(profileUser.height, latestWeight); const real=calculateWorkoutTimeStats(workouts); $("#profileTotalWorkouts").text(workouts.length); $("#profileTotalCalories").text(formatNumber(totalCalories)); $("#profileTotalDuration").text(formatNumber(totalDuration)); $("#profileBMI").text(bmi?bmi.value:"--"); $("#profileBMILabel").text(bmi?bmi.label:"Chưa đủ dữ liệu"); $("#profileWeeklyPercent").text(`${weekly.percent}%`); $("#profileWeeklyText").text(`${weekly.totalWorkouts}/${weekly.goal} buổi`); $("#profileTodaySummary").text(`${real.todayCount} buổi • ${real.todayDuration} phút • ${real.todayCalories} kcal hôm nay`); }
function renderProfileWorkoutList(workouts){ const list=$("#profileWorkoutList"); list.html(""); if(!workouts.length){list.html(`<div class="empty-box text-center p-4"><div class="display-6 mb-2">🗒️</div><h5 class="fw-bold">Bạn chưa có buổi tập nào</h5><p class="text-muted mb-0">Hãy thêm nhật ký ở form bên trên.</p></div>`);return;} workouts.slice(0,10).forEach(w=>list.append(`<div class="profile-workout-item"><div><div class="fw-bold">${getTypeIcon(w.type)} ${w.name}</div><small class="text-muted">${w.type} • ${w.intensity||"Chưa rõ"} • ${formatDate(w.date)} • ${w.mood||""}</small></div><div class="text-end"><strong>${w.calories} kcal</strong><br><small class="text-muted">${w.duration} phút</small></div></div>`)); }
function getQuickWorkoutData(){ return { userId:String(profileUser.id), name:$("#quickName").val().trim(), type:$("#quickType").val(), muscleGroup:$("#quickMuscleGroup").val().trim(), duration:Number($("#quickDuration").val()), calories:Number($("#quickCalories").val()), date:$("#quickDate").val(), intensity:$("#quickIntensity").val(), mood:$("#quickMood").val(), sleepHours:Number($("#quickSleepHours").val()||0), waterLiters:Number($("#quickWaterLiters").val()||0), weightToday:Number($("#quickWeightToday").val()||0), completed:$("#quickCompleted").is(":checked"), note:$("#quickNote").val().trim(), createdAt:nowISOString(), updatedAt:nowISOString() }; }
function addPersonalWorkout(){ clearErrors(); const data=getQuickWorkoutData(); const validation=validateWorkoutForm(data); const map={name:"quickName",type:"quickType",muscleGroup:"quickMuscleGroup",duration:"quickDuration",calories:"quickCalories",date:"quickDate",sleepHours:"quickSleepHours",waterLiters:"quickWaterLiters",weightToday:"quickWeightToday"}; if(!validation.isValid){Object.keys(validation.errors).forEach(f=>showFieldError(map[f],validation.errors[f])); return showToast("Vui lòng kiểm tra lại nhật ký","error");} $("#addQuickWorkoutBtn").prop("disabled",true).text("Đang thêm..."); createWorkout(data).then(()=>{showToast("Đã thêm nhật ký tập luyện","success"); $("#quickWorkoutForm")[0].reset(); $("#quickDate").val(toDateOnly(nowISOString())); loadProfileWorkouts();}).catch(()=>showToast("Không thể thêm nhật ký","error")).finally(()=>$("#addQuickWorkoutBtn").prop("disabled",false).text("Thêm vào nhật ký")); }
