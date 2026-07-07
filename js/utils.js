function formatNumber(number) {
  return Number(number || 0).toLocaleString("vi-VN");
}

function formatDate(dateString) {
  if (!dateString) return "Chưa cập nhật";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("vi-VN");
}

function toDateOnly(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach(function (element) {
    element.textContent = "";
  });
}

function showFieldError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (errorElement) errorElement.textContent = message;
}

function validateWorkoutForm(data) {
  const errors = {};
  if (!data.name || data.name.trim() === "") errors.name = "Tên bài tập không được để trống";
  if (!data.type || data.type.trim() === "") errors.type = "Vui lòng chọn loại bài tập";
  if (!data.muscleGroup || data.muscleGroup.trim() === "") errors.muscleGroup = "Nhóm cơ không được để trống";
  if (!data.duration || Number(data.duration) <= 0) errors.duration = "Thời lượng phải lớn hơn 0";
  if (!data.calories || Number(data.calories) <= 0) errors.calories = "Calo phải lớn hơn 0";
  if (!data.date || data.date.trim() === "") errors.date = "Ngày tập không được để trống";
  if (data.sleepHours !== undefined && data.sleepHours !== "" && Number(data.sleepHours) < 0) errors.sleepHours = "Giờ ngủ không hợp lệ";
  if (data.waterLiters !== undefined && data.waterLiters !== "" && Number(data.waterLiters) < 0) errors.waterLiters = "Lượng nước không hợp lệ";
  if (data.weightToday !== undefined && data.weightToday !== "" && Number(data.weightToday) <= 0) errors.weightToday = "Cân nặng phải lớn hơn 0";
  return { isValid: Object.keys(errors).length === 0, errors: errors };
}

function showToast(message, type = "success") {
  const toastElement = document.getElementById("appToast");
  const toastTitle = document.getElementById("toastTitle");
  const toastMessage = document.getElementById("toastMessage");
  if (!toastElement || !toastMessage || !toastTitle) {
    alert(message);
    return;
  }
  toastTitle.textContent = type === "success" ? "Thành công" : "Thông báo";
  toastMessage.textContent = message;
  toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning");
  toastElement.classList.add(type === "success" ? "text-bg-success" : type === "warning" ? "text-bg-warning" : "text-bg-danger");
  new bootstrap.Toast(toastElement).show();
}

function showLoading(selector) { $(selector).removeClass("d-none").hide().fadeIn(180); }
function hideLoading(selector) { $(selector).fadeOut(120, function(){ $(this).addClass("d-none"); }); }

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 1);
  return d;
}

function isThisWeek(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  return date >= getStartOfWeek(new Date());
}

function calculateWeeklyStats(workouts, user) {
  const weekly = workouts.filter(function (item) { return isThisWeek(item.date); });
  const totalCalories = weekly.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const totalDuration = weekly.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const goal = Number(user && user.weeklyWorkoutGoal ? user.weeklyWorkoutGoal : 4);
  const percent = goal > 0 ? Math.min(100, Math.round((weekly.length / goal) * 100)) : 0;
  return { weekly, totalWorkouts: weekly.length, totalCalories, totalDuration, goal, percent };
}

function calculateStreak(workouts) {
  const dateSet = new Set(workouts.map(w => toDateOnly(w.date)).filter(Boolean));
  if (dateSet.size === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(today.getDate() - i);
    const key = toDateOnly(check.toISOString());
    if (dateSet.has(key)) streak += 1;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

function calculateBMI(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w) return null;
  const value = w / (h * h);
  let label = "Tham khảo";
  if (value < 18.5) label = "Hơi thấp";
  else if (value < 23) label = "Phù hợp";
  else if (value < 25) label = "Cần chú ý";
  else label = "Nên theo dõi thêm";
  return { value: value.toFixed(1), label };
}

function average(values) {
  const nums = values.map(Number).filter(v => !Number.isNaN(v) && v > 0);
  if (!nums.length) return 0;
  return nums.reduce((a,b)=>a+b,0) / nums.length;
}

function getWorkoutSuggestion(workouts, user) {
  if (!workouts.length) return "Bạn hãy bắt đầu bằng một buổi tập nhẹ 15-20 phút như đi bộ, yoga hoặc giãn cơ.";
  const sorted = [...workouts].sort((a,b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const daysDiff = Math.floor((new Date() - new Date(latest.date)) / (1000*60*60*24));
  if (daysDiff >= 3) return "Bạn đã vài ngày chưa ghi nhận buổi tập. Hôm nay nên chọn bài nhẹ để lấy lại nhịp.";
  if (Number(latest.sleepHours || 0) > 0 && Number(latest.sleepHours) < 6) return "Giấc ngủ gần nhất hơi ít, nên ưu tiên đi bộ nhẹ, yoga hoặc giãn cơ.";
  if (latest.intensity === "Cao") return "Buổi gần nhất có cường độ cao, hôm nay có thể tập phục hồi hoặc nhóm cơ khác.";
  const cardioCount = sorted.slice(0,5).filter(w => w.type === "Cardio").length;
  if (cardioCount >= 3) return "Bạn tập Cardio khá nhiều gần đây, có thể thêm Strength hoặc Yoga để cân bằng.";
  return `Bạn đang duy trì tốt. Hôm nay có thể tiếp tục mục tiêu "${(user && user.goal) || "Duy trì sức khỏe"}" với một buổi tập vừa sức.`;
}

function groupWorkoutsByDate(workouts) {
  return workouts.reduce(function(groups, workout) {
    const key = toDateOnly(workout.date) || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(workout);
    return groups;
  }, {});
}

function getTypeBadgeClass(type) {
  const t = String(type || "").toLowerCase();
  if (t === "cardio") return "badge-cardio";
  if (t === "strength") return "badge-strength";
  if (t === "yoga") return "badge-yoga";
  if (t === "sport") return "badge-sport";
  return "badge-default";
}

function getTypeIcon(type) {
  const t = String(type || "").toLowerCase();
  if (t === "cardio") return "🏃";
  if (t === "strength") return "💪";
  if (t === "yoga") return "🧘";
  if (t === "sport") return "⚽";
  return "🏋️";
}

function getIntensityClass(intensity) {
  if (intensity === "Cao") return "text-bg-danger";
  if (intensity === "Vừa") return "text-bg-warning";
  if (intensity === "Nhẹ") return "text-bg-info";
  return "text-bg-secondary";
}

// ===== Phase 8: Real-time helpers =====
function nowISOString() { return new Date().toISOString(); }
function formatDateTime(dateString) {
  if (!dateString) return "Chưa cập nhật";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}
function isToday(dateString) {
  return toDateOnly(dateString) === toDateOnly(new Date().toISOString());
}
function isThisMonth(dateString) {
  const d = new Date(dateString), n = new Date();
  return !Number.isNaN(d.getTime()) && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function getLastNDays(days = 7) {
  const result = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    result.push(toDateOnly(d.toISOString()));
  }
  return result;
}
function getDailyWorkoutSummary(workouts, days = 7) {
  const keys = getLastNDays(days);
  return keys.map(function(key) {
    const items = workouts.filter(w => toDateOnly(w.date) === key);
    return {
      date: key,
      count: items.length,
      calories: items.reduce((s,w)=>s+Number(w.calories||0),0),
      duration: items.reduce((s,w)=>s+Number(w.duration||0),0),
    };
  });
}
function getAdvancedWorkoutSuggestion(workouts, user) {
  const goal = String(user && user.goal || "Duy trì sức khỏe");
  if (!workouts.length) return `Bạn có thể bắt đầu bằng 15-20 phút vận động nhẹ. Mục tiêu hiện tại: ${goal}.`;
  const sorted = [...workouts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const latest = sorted[0];
  const latestDate = new Date(latest.date);
  const daysDiff = Number.isNaN(latestDate.getTime()) ? 0 : Math.floor((new Date() - latestDate)/(1000*60*60*24));
  if (daysDiff >= 3) return "Bạn đã vài ngày chưa ghi nhật ký. Hôm nay nên chọn bài nhẹ như đi bộ, yoga hoặc giãn cơ để lấy lại nhịp.";
  if (Number(latest.sleepHours || 0) > 0 && Number(latest.sleepHours) < 6) return "Giấc ngủ gần nhất hơi ít, nên ưu tiên bài nhẹ và theo dõi cảm giác sau tập.";
  if (latest.intensity === "Cao") return "Buổi gần nhất cường độ cao. Hôm nay nên tập phục hồi, yoga hoặc chuyển sang nhóm cơ khác.";
  if (goal.includes("Tăng cơ")) return "Gợi ý: chọn bài Strength, tập nhóm cơ khác buổi gần nhất và ghi lại cường độ sau tập.";
  if (goal.includes("sức bền")) return "Gợi ý: chọn Cardio cường độ vừa, theo dõi thời gian tập và nhịp duy trì qua từng ngày.";
  if (goal.includes("Giảm")) return "Gợi ý: kết hợp Cardio vừa sức và ghi lại calo, thời lượng, nước uống sau buổi tập.";
  return "Bạn đang duy trì ổn. Hãy chọn bài vừa sức và ghi đầy đủ giấc ngủ, nước uống, cảm nhận hôm nay.";
}
function calculateWorkoutTimeStats(workouts) {
  const today = workouts.filter(w=>isToday(w.date));
  const month = workouts.filter(w=>isThisMonth(w.date));
  return {
    todayCount: today.length,
    todayCalories: today.reduce((s,w)=>s+Number(w.calories||0),0),
    todayDuration: today.reduce((s,w)=>s+Number(w.duration||0),0),
    monthCount: month.length,
    monthCalories: month.reduce((s,w)=>s+Number(w.calories||0),0),
    monthDuration: month.reduce((s,w)=>s+Number(w.duration||0),0),
  };
}
